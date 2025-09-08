import { XMLParser } from "fast-xml-parser";
import Axios, { AxiosInstance, CanceledError } from "axios";
import { StandaloneLogger } from "./logger";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import crypto from "crypto";
import forge from "node-forge";
import { mkdir, readFile, rm, writeFile } from "fs";
import { app } from "electron";
import path from "path";
import { promisify } from "util";
import SunshineCodec from "@enum/sunshine-codec";
import IMoonlightHostStatus from "@interface/moonlight-host-status.interface";
import IMoonlightHostDiskInfo from "@interface/moonlight-host-disk-info.interface";
import ISunshineServerInfo from "@interface/sunshine-server-info.interface";
import IMachine from "@interface/machine.interface";
import IMoonlightPairServerCertificate from "@interface/moonlight-pair-server-certificate.interface";
import IMoonlightPairClientChallengeResponse from "@interface/moonlight-pair-client-challenge-response.interface";
import IMoonlightPairServerChallengeResponse from "@interface/moonlight-pair-server-challenge-response.interface";
import IMoonlightPairClientPairingCheck from "@interface/moonlight-pair-client-pairing-check.interface";
import { AgentOptions } from "https";
import { IpcMain } from "./ipc";
import { Emitter } from "@util/emitter.util";
import ISunshineAppList from "@interface/moonlight-app-list.interface";
import ISunshineApp from "@interface/moonlight-app.interface";
import { assertMachineDiscovered } from "@util/object.util";

type Events = {
	status: [IMoonlightHostStatus];
};

export default class MoonlightHost extends Emitter<Events> {
	private readonly axios: AxiosInstance;
	private uuid: string | null = null;
	private httpsPort: number | null = null;
	private infoFetchAbort: AbortController | null = null;
	private logger: StandaloneLogger;
	private pairAbort: AbortController | null = null;
	private destroyed = false;
	private readonly destroyCallbacks = new Set<() => void>();

	private data: IMoonlightHostDiskInfo;
	private status: IMoonlightHostStatus = {
		online: false,
	};

	static async fromUuid(uuid: string, controller: MoonlightEmbeddedController) {
		const filePath = path.join(this.getStorageDir(), `${uuid}.json`);
		const contents = await promisify(readFile)(filePath, "utf-8");
		const json = JSON.parse(contents) as IMoonlightHostDiskInfo;
		if (typeof json.address != "string" || typeof json.port != "number") {
			throw new Error("Disk info missing address or port");
		}
		return controller.addHost(json.address, json.port);
	}

	constructor(
		address: string,
		port: number | null,
		private readonly controller: MoonlightEmbeddedController,
		private readonly ipc: IpcMain,
	) {
		super();
		this.data = {
			address,
			port: port || 47989,
			discovered: false,
		};

		this.axios = Axios.create({
			baseURL: `http://${this.getAddress()}`,
		});
		this.logger = new StandaloneLogger(`Moonlight ${this.getAddress()}`);
		this.logger.log(`Created new Moonlight host`);

		this.restoreInfo()
			.catch(() => {
				this.logger.log("Couldn't restore info from disk, host must be new.");
			})
			.finally(() => this.fetchServerInfo())
			.catch((e) => this.logger.error("Error while fetching server info:", e));

		this.destroyCallbacks.add(
			ipc.addEventListener("pair", (uuid) => {
				if (!uuid || uuid != this.uuid) {
					return;
				}

				if (this.status.online && this.status.isPaired) {
					this.logger.log(
						"Received pairing request but host is already paired, ignoring.",
					);
				} else {
					this.logger.log("Received pairing request.");
					this.pair().catch((error) =>
						this.logger.error("Failed to pair", error),
					);
				}
			}),
		);

		this.destroyCallbacks.add(
			ipc.addEventListener("stream", (uuid, appId) => {
				if (!uuid || uuid != this.uuid) {
					return;
				}

				if (!this.status.online || !this.status.isPaired) {
					this.logger.log(
						"Received request for app list but host isn't paired or online.",
					);
					return;
				}

				const app = this.status.apps.find((app) => app.id == appId);
				if (!app) {
					this.logger.log(
						`Received request to stream app "${appId}" but it doesn't exist.`,
					);
					return;
				}

				this.logger.log(`Starting to stream app "${app.name}"`);
				this.controller.startStream(this, app).then(() => {
					this.logger.log("Stream has finished");
				});
			}),
		);
	}

	async fetchServerInfo(): Promise<void> {
		if (this.destroyed) {
			throw new Error("Host is destroyed");
		}

		const controller = new AbortController();

		const fetch = async (
			axiosFactory: () => AxiosInstance | Promise<AxiosInstance>,
			secure: boolean,
		) => {
			const createAxios = () => Promise.resolve(axiosFactory());
			if (this.infoFetchAbort) {
				this.infoFetchAbort.abort();
			}

			const response = await createAxios().then((axios) =>
				axios.get("serverinfo", {
					signal: controller.signal,
				}),
			);

			if (response.status != 200) {
				throw new Error(`/serverinfo response status was ${response.status}`);
			}

			const parser = new XMLParser({
				ignoreAttributes: false,
			});
			const { root: xml } = parser.parse(response.data) as {
				root: ISunshineServerInfo;
			};

			if (xml["@_status_code"] != "200") {
				throw new Error("HTTPS is unauthorized");
			}

			const codecs: SunshineCodec[] = [];
			const codecBits: Record<SunshineCodec, number> = {
				h264: 1,
				h265: 2,
				hdr10: 4,
				vp9: 8,
				av1: 16,
				hdr: 256,
				h264_software: 10_000,
				h265_software: 20_000,
			};

			for (let [codec, bit] of Object.entries(codecBits)) {
				if (!!(xml.ServerCodecModeSupport & bit)) {
					codecs.push(codec as SunshineCodec);
				}
			}

			const isNewUuid = this.uuid != xml.uniqueid;
			this.uuid = xml.uniqueid;
			this.httpsPort = xml.HttpsPort;

			if (isNewUuid) {
				this.logger.log("UUID was updated.");
				try {
					await this.restoreInfo();
				} catch {}
			}

			this.updateDiskInfo((old) => ({
				address: old.address,
				port: old.port,
				discovered: true,
				uuid: xml.uniqueid,
				name: xml.hostname,
				type: xml.mac == "00:00:00:00:00:00" ? "sunshine" : "gamestream", // sunshine doesn't pass real mac address
				serverCert: old.discovered ? old.serverCert : null,
				appVersion: xml.appversion,
			}));

			if (secure) {
				const uniqueId = await this.controller.getUniqueId();
				const response = await createAxios().then((axios) =>
					axios.get("applist", {
						params: new URLSearchParams({
							uniqueid: uniqueId,
							uuid: this.randomUUID(),
						}),
					}),
				);

				const { root: xml } = parser.parse(response.data) as {
					root: ISunshineAppList;
				};

				if (xml["@_status_code"] != "200") {
					throw new Error("HTTPS is unauthorized");
				}

				const apps: ISunshineApp[] = [];
				if (Array.isArray(xml.App)) {
					apps.push(...xml.App);
				} else {
					apps.push(xml.App);
				}
				this.updateStatus({
					online: true,
					codecs,
					isPaired: true,
					apps: apps.map((app) => ({
						id: app.ID,
						name: app.AppTitle,
						supportsHdr: !!app.IsHdrSupported,
					})),
					isPairing: false,
				});
			} else {
				this.updateStatus({
					online: true,
					codecs,
					isPaired: false,
					isPairing: this.status.online && this.status.isPairing,
				});
			}
		};

		if (!this.status.online || !this.status.isPairing) {
			if (this.status.online && this.status.isPaired) {
				try {
					this.logger.log(
						"Checking if host continues to support secure connections.",
					);
					await fetch(() => this.createSecureAxios(), true);
					this.logger.log(
						"Secure connections are still supported, host is still paired.",
					);
				} catch (e) {
					if (e instanceof CanceledError) {
						return;
					}
					this.logger.log(
						e,
						"Insecure connections are no longer supported, host is unpaired or offline.",
					);
					if (this.status.online) {
						this.updateStatus({
							online: true,
							codecs: this.status.codecs,
							isPaired: false,
							isPairing: this.status.online && this.status.isPairing,
						});
					}
				}
			} else {
				try {
					this.logger.log("Establishing insecure connection.");
					await fetch(() => this.axios, false);
					this.logger.log(
						"Insecure connection established, attempting secure connection.",
					);

					try {
						await fetch(() => this.createSecureAxios(), true);
						this.logger.log("Secure connection established, host is paired.");
					} catch (e) {
						if (e instanceof CanceledError) {
							return;
						}
						this.logger.log(
							"Failed to establish secure connection, host isn't paired.",
						);
					}
				} catch (e) {
					if (e instanceof CanceledError) {
						return;
					}
					this.updateStatus({
						online: false,
					});

					this.logger.log(
						"Couldn't establish insecure connection, host is offline or inaccessable.",
					);
				}
			}
		}

		if (!controller.signal.aborted) {
			this.logger.log("Queueing next identification request.");

			const timeout = setTimeout(() => {
				this.fetchServerInfo();
			}, 10_000);

			controller.signal.addEventListener("abort", () => {
				clearTimeout(timeout);
			});
		}
	}

	getMachine(): IMachine {
		return structuredClone({
			...this.status,
			config: this.data,
		});
	}

	getAddress() {
		return `${this.data.address}:${this.data.port}`;
	}

	private randomPin() {
		const randomInt = () => Math.floor(Math.random() * 10);
		return Array(4).fill(null).map(randomInt).join("");
	}

	private randomUUID() {
		return crypto.randomUUID().split("-").join("");
	}

	static getStorageDir() {
		return path.join(app.getPath("userData"), "gfe");
	}

	private getStorageFile() {
		if (!this.uuid) {
			throw new Error("UUID is unknown");
		}
		return path.join(MoonlightHost.getStorageDir(), `${this.uuid}.json`);
	}

	private updateStatus(status: IMoonlightHostStatus) {
		const oldSerialized = JSON.stringify(this.status);
		const newSerialized = JSON.stringify(status);
		if (oldSerialized == newSerialized) {
			this.logger.log(
				"Requested to update status but with no changes. Ignoring.",
			);
			return;
		}
		this.status = status;
		this.emit("status", this.getMachine());
	}

	private async updateDiskInfo(
		dataCallback: (oldInfo: IMoonlightHostDiskInfo) => IMoonlightHostDiskInfo,
		forceOverwrite?: boolean,
	) {
		if (this.destroyed) {
			throw new Error("Host is destroyed");
		}
		const oldSerialized = JSON.stringify(this.data);
		const newData = {
			...dataCallback(this.data),
			address: this.data.address, // manually pass address and port AFTER callback so they can't be overridden
			port: this.data.port,
		} as IMoonlightHostDiskInfo;
		const newSerialized = JSON.stringify(newData);
		if (oldSerialized == newSerialized) {
			this.logger.log(
				"Requested to update disk info but with no changes. Ignoring.",
			);
			return;
		}
		this.data = newData;
		this.emit("status", this.getMachine());

		if (!newData.discovered || !forceOverwrite) {
			const storageFile = this.getStorageFile();
			this.logger.log(`Saving info to disk... (${storageFile})`);
			await promisify(mkdir)(MoonlightHost.getStorageDir(), {
				recursive: true,
			});
			await promisify(writeFile)(storageFile, JSON.stringify(newData, null, 2));
		}
	}

	private async restoreInfo() {
		const storageFile = this.getStorageFile();
		this.logger.log(`Reading info from disk... (${storageFile})`);
		const data = await promisify(readFile)(storageFile);
		const json = JSON.parse(data.toString("utf-8")) as IMoonlightHostDiskInfo;
		this.logger.log("Successfully read info from disk:", json);
		this.data = json;
	}

	async pair() {
		if (this.destroyed) {
			throw new Error("Host is destroyed");
		}
		if (this.infoFetchAbort) {
			this.infoFetchAbort.abort();
		}
		const controller = new AbortController();
		try {
			if (!this.status.online) {
				throw new Error("Host isn't online");
			}

			if (this.pairAbort) {
				this.pairAbort.abort();
				this.pairAbort = null;
				if (this.status.online) {
					this.updateStatus({
						...this.status,
						isPairing: false,
					});
				}
			}
			if (!this.data.discovered || !this.data.appVersion) {
				throw new Error("Server version unknown");
			}
			const isV7 = parseInt(this.data.appVersion.split(".")[0]) >= 7;

			this.logger.log(
				`Beginning pair request to ${isV7 ? "V7+" : "Old"} server (${this.data.appVersion}).`,
			);

			this.pairAbort = controller;
			if (!this.status.online) {
				throw new Error("Host isn't online");
			}
			this.updateStatus({
				...this.status,
				isPairing: true,
			});

			const publicKey = await this.controller.getPublicKey();
			const uniqueId = await this.controller.getUniqueId();

			const pin = this.randomPin();
			const salt = crypto.randomBytes(16);
			const saltPin = Buffer.concat([salt, Buffer.from(pin, "ascii")]);

			const machine = this.getMachine();
			assertMachineDiscovered(machine);
			this.ipc.send("pairing_code", pin, machine);

			const response1 = await this.axios.get(`pair`, {
				signal: controller.signal,
				params: new URLSearchParams({
					uniqueid: uniqueId,
					uuid: this.randomUUID(),
					devicename: "roth",
					updateState: "1",
					phrase: "getservercert",
					salt: salt.toString("hex"),
					clientcert: publicKey.toString("hex"),
				}),
			});

			const parser = new XMLParser({
				ignoreAttributes: false,
			});
			const { root: xml1 } = parser.parse(response1.data) as {
				root: IMoonlightPairServerCertificate;
			};

			if (!xml1.paired) {
				throw new Error("Pairing failed at step 1");
			}

			const serverCert = Buffer.from(xml1.plaincert, "hex");

			let aesKey: Buffer;
			const aesAlgorithm = "aes-128-ecb";
			if (isV7) {
				// For v7+, the key is the first 16 bytes of the SHA256 hash of the salt+pin.
				const sha256 = crypto.createHash("sha256").update(saltPin).digest();
				aesKey = sha256.subarray(0, 16);
			} else {
				// For older versions, it's the first 16 bytes of the SHA1 hash.
				const sha1 = crypto.createHash("sha1").update(saltPin).digest();
				aesKey = sha1.subarray(0, 16);
			}

			const clientChallengePlain = crypto.randomBytes(16);
			const clientChallengeCipher = crypto.createCipheriv(
				aesAlgorithm,
				aesKey,
				null,
			);
			clientChallengeCipher.setAutoPadding(false);
			const clientChallengeHex = Buffer.concat([
				clientChallengeCipher.update(clientChallengePlain),
				clientChallengeCipher.final(),
			]).toString("hex");

			const response2 = await this.axios.get("pair", {
				signal: controller.signal,
				params: new URLSearchParams({
					uniqueid: uniqueId,
					uuid: this.randomUUID(),
					devicename: "roth",
					updateState: "1",
					clientchallenge: clientChallengeHex,
				}),
			});

			const { root: xml2 } = parser.parse(response2.data) as {
				root: IMoonlightPairClientChallengeResponse;
			};

			if (!xml2.paired) {
				throw new Error("Pairing failed at step 2");
			}

			const respBuf = Buffer.from(xml2.challengeresponse, "hex");
			const decipher = crypto.createDecipheriv(aesAlgorithm, aesKey, null);
			decipher.setAutoPadding(false);
			const decryptedChallenge = Buffer.concat([
				decipher.update(respBuf),
				decipher.final(),
			]);

			const challengeSuffix = decryptedChallenge.subarray(
				decryptedChallenge.length - 16,
			);

			const clientCertPem = publicKey.toString("utf-8");
			const clientCertForge = forge.pki.certificateFromPem(clientCertPem);
			const signatureBytes = Buffer.from(clientCertForge.signature, "binary");

			const clientSecret = crypto.randomBytes(16);
			const challengeResponse = Buffer.concat([
				challengeSuffix,
				signatureBytes,
				clientSecret,
			]);

			const challengeResponseHash = crypto
				.createHash(isV7 ? "sha256" : "sha1")
				.update(challengeResponse)
				.digest();

			const challengeCipher = crypto.createCipheriv(aesAlgorithm, aesKey, null);

			challengeCipher.setAutoPadding(false);

			const encryptedHash = Buffer.concat([
				challengeCipher.update(challengeResponseHash),
				challengeCipher.final(),
			]);

			await new Promise<void>((r) => setTimeout(r, 1000));

			const response3 = await this.axios.get("pair", {
				signal: controller.signal,
				params: new URLSearchParams({
					uniqueid: uniqueId,
					uuid: this.randomUUID(),
					devicename: "roth",
					updateState: "1",
					serverchallengeresp: encryptedHash.toString("hex"),
				}),
			});

			const { root: xml3 } = parser.parse(response3.data) as {
				root: IMoonlightPairServerChallengeResponse;
			};

			if (!xml3.paired) {
				throw new Error("Pairing failed at step 3");
			}

			const pairingSecret = Buffer.from(xml3.pairingsecret, "hex");
			const secretHash = pairingSecret.subarray(0, 16);
			const secretSignature = pairingSecret.subarray(16);

			const serverVerify = crypto
				.createVerify(isV7 ? "sha256" : "sha1")
				.update(secretHash);

			if (!serverVerify.verify(serverCert.toString("utf-8"), secretSignature)) {
				throw new Error("Couldn't verify server's identity");
			}

			const clientSignature = await this.controller.sign(
				clientSecret,
				isV7 ? "sha256" : "sha1",
			);
			const clientPairingSecret = Buffer.concat([
				clientSecret,
				clientSignature,
			]);

			await this.axios.get("pair", {
				signal: controller.signal,
				params: {
					uniqueid: uniqueId,
					uuid: this.randomUUID(),
					devicename: "roth",
					updateState: "1",
					clientpairingsecret: clientPairingSecret.toString("hex"),
				},
			});

			if (!this.httpsPort) {
				throw new Error("Unknown secure port");
			}

			const secureAxios = await this.createSecureAxios({
				ca: serverCert,
			});

			const response5 = await secureAxios.get("pair", {
				signal: controller.signal,
				params: new URLSearchParams({
					uniqueid: uniqueId,
					uuid: this.randomUUID(),
					devicename: "roth",
					updateState: "1",
					phrase: "pairchallenge",
				}),
			});

			if (response5.status != 200) {
				throw new Error("Pairing failed at final step");
			}

			const { root: xml5 } = parser.parse(response5.data) as {
				root: IMoonlightPairClientPairingCheck;
			};

			if (!xml5.paired) {
				throw new Error("Pairing failed at final step");
			}

			this.logger.log("Paired successfully");

			await this.updateDiskInfo((old) => {
				if (!old.discovered) {
					return old;
				}
				return {
					address: old.address,
					port: old.port,
					discovered: true,
					name: old.name,
					uuid: old.uuid,
					type: old.type,
					serverCert: serverCert.toString("base64"),
					appVersion: old.appVersion,
				};
			});

			if (this.pairAbort == controller) {
				this.pairAbort = null;
				this.updateStatus({
					...this.status,
					isPairing: false,
				});
			}
		} catch (e) {
			if (this.pairAbort == controller) {
				this.pairAbort = null;
				if (this.status.online) {
					this.updateStatus({
						...this.status,
						isPairing: false,
					});
				}
			}
			if (e instanceof CanceledError) {
				return;
			}
			throw e;
		} finally {
			this.fetchServerInfo();
		}
	}

	private async createSecureAxios(
		httpsOptions?: Omit<Omit<AgentOptions, "key">, "cert">,
	) {
		let serverCert:
			| string
			| Buffer<ArrayBufferLike>
			| (string | Buffer<ArrayBufferLike>)[];
		if (httpsOptions?.ca) {
			serverCert = httpsOptions.ca;
		} else {
			if (!this.data.discovered || !this.data.serverCert) {
				throw new Error(
					"Couldn't create secure connection because host isn't paired.",
				);
			}

			serverCert = Buffer.from(this.data.serverCert, "base64");
		}

		if (!this.httpsPort) {
			throw new Error(
				"Cannot create secure Axios instance because HTTPS port is unknown.",
			);
		}

		const httpsAgent = await this.controller.createHttpsAgent({
			ca: serverCert,
			checkServerIdentity: () => undefined,
			...httpsOptions,
		});

		return Axios.create({
			baseURL: `https://${this.data.address}:${this.httpsPort}`,
			httpsAgent,
		});
	}

	async unpair() {
		// todo: handle 404
		const uniqueId = await this.controller.getUniqueId();

		const response = await this.axios.get("unpair", {
			params: new URLSearchParams({
				uniqueid: uniqueId,
				uuid: this.randomUUID(),
			}),
		});

		console.log(response.status, response.data);
	}

	async getAppImage(appId: number) {
		try {
			const axios = await this.createSecureAxios();
			const response = await axios.get("boxart", {
				params: new URLSearchParams({
					appid: appId.toString(),
				}),
			});
			console.log(response.data, response.status);
			return "hello";
		} catch (e) {
			this.logger.error("Failed to get box art", e);
			return null;
		}
	}

	destroy() {
		this.destroyed = true;
		this.pairAbort?.abort();
		this.infoFetchAbort?.abort();
		for (let callback of this.destroyCallbacks) {
			callback();
		}

		try {
			const fileName = this.getStorageFile();
			promisify(rm)(fileName, {
				force: true,
			})
				.then(() => {
					this.logger.log("Removed host file.");
				})
				.catch((e) => {
					this.logger.error("failed to remove host file:", e);
				});
		} catch {}
	}
}
