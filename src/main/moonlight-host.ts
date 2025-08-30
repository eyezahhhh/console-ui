import { XMLParser } from "fast-xml-parser";
import Axios, { AxiosInstance, AxiosResponse, CanceledError } from "axios";
import { StandaloneLogger } from "./logger";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import crypto from "crypto";
import forge from "node-forge";
import { mkdir, readFile, writeFile } from "fs";
import { app } from "electron";
import path from "path";
import { promisify } from "util";
import SunshineCodec from "@enum/sunshine-codec";
import IMoonlightHostStatus from "@interface/moonlight-host-status.interface";
import IMoonlightHostDiskInfo from "@interface/moonlight-host-disk-info.interface";
import ISunshineServerInfo from "@interface/sunshine-server-info.interface";
import IMachine from "@interface/machine.interface";
import IMoonlightServerCertificate from "@interface/moonlight-server-certificate.interface";
import IMoonlightClientChallengeResponse from "@interface/moonlight-client-challenge-response.interface";
import IMoonlightServerChallengeResponse from "@interface/moonlight-server-challenge-response.interface";
import IMoonlightClientPairingCheck from "@interface/moonlight-client-pairing-check.interface";
import { AgentOptions } from "https";
import MachineState from "@enum/machine-state.enum";
import { IpcMain } from "./ipc";
import { Emitter } from "@util/emitter.util";
import ISunshineApp from "@interface/sunshine-app.interface";
import ISunshineAppList from "@interface/sunshine-app-list.interface";

type Events = {
	status: [IMoonlightHostStatus];
	apps: [ISunshineApp[]];
};
export default class MoonlightHost extends Emitter<Events> {
	private readonly axios: AxiosInstance;
	private readonly port: number;
	private isHttpsSupported = false;
	private uuid: string | null = null;
	private name: string | null = null;
	private codecs: SunshineCodec[] = [];
	private httpsPort: number | null = null;
	private type: "sunshine" | "gamestream" | null = null;
	private version: string | null = null;
	// private updateListeners = new Set<(status: IMoonlightHostStatus) => void>();
	private infoFetchAbort: AbortController | null = null;
	private logger: StandaloneLogger;
	private diskData: IMoonlightHostDiskInfo | null = null;
	private pairAbort: AbortController | null = null;
	private apps: ISunshineApp[] = [];

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
		private readonly address: string,
		port: number | null,
		private readonly controller: MoonlightEmbeddedController,
		private readonly ipc: IpcMain,
	) {
		super();
		this.port = port || 47989;
		this.axios = Axios.create({
			baseURL: `http://${address}:${this.port}`,
		});
		this.logger = new StandaloneLogger(`Moonlight ${address}:${this.port}`);
		this.logger.log(`Created new Moonlight host`);

		this.fetchServerInfo().catch((error) => this.logger.error(error));

		this.addEventListener("apps", () => {
			this.emit("status", this.getStatus());
		});

		ipc.addEventListener("pair", (uuid) => {
			if (!uuid || uuid != this.uuid) {
				return;
			}

			if (this.isHttpsSupported) {
				this.logger.log(
					"Received pairing request but host is already paired, ignoring.",
				);
			} else {
				this.logger.log("Received pairing request.");
				this.pair().catch((error) =>
					this.logger.error("Failed to pair", error),
				);
			}
		});

		ipc.addEventListener("stream", (uuid, appId) => {
			if (!uuid || uuid != this.uuid) {
				return;
			}

			const app = this.apps.find((app) => app.ID == appId);
			if (!app) {
				this.logger.log(
					`Received request to stream app "${appId}" but it doesn't exist.`,
				);
				return;
			}

			this.logger.log(`Starting to stream app "${app.AppTitle}"`);
			this.controller.startStream(this, app).then(() => {
				this.logger.log("Stream has finished");
			});
		});
	}

	async fetchServerInfo(): Promise<void> {
		const controller = new AbortController();

		const fetch = async (
			axiosFactory: () => AxiosInstance | Promise<AxiosInstance>,
			secure: boolean,
		) => {
			const createAxios = () => Promise.resolve(axiosFactory());
			if (this.infoFetchAbort) {
				this.infoFetchAbort.abort();
			}

			const oldStatus = this.getStatus();

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
			this.codecs = codecs;
			this.name = xml.hostname;
			this.httpsPort = xml.HttpsPort;
			this.version = xml.appversion;
			this.type = xml.mac == "00:00:00:00:00:00" ? "sunshine" : "gamestream"; // sunshine doesn't pass real mac address

			if (isNewUuid) {
				try {
					await this.restoreInfo();
					this.logger.log("Loaded data from disk");
				} catch {}
			}

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
				if (Array.isArray(xml.App)) {
					this.apps = xml.App;
				} else {
					this.apps = [xml.App];
				}
				this.emit("apps", this.apps);

				if (xml["@_status_code"] != "200") {
					throw new Error("HTTPS is unauthorized");
				}
			}

			if (JSON.stringify(oldStatus) != JSON.stringify(this.getStatus())) {
				this.emit("status", this.getStatus());
			}
		};

		if (this.isHttpsSupported) {
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
				this.isHttpsSupported = false;
				this.emit("status", this.getStatus());
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
					this.isHttpsSupported = true;
					this.logger.log("Secure connection established, host is paired.");
					this.emit("status", this.getStatus());
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
				this.isHttpsSupported = false; // connection failed, use insecure next time we attempt to connect
				this.name = null; // missing name means host is offline
				this.emit("status", this.getStatus());
				this.logger.log(
					"Couldn't establish insecure connection, host is offline or inaccessable.",
				);
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

	getStatus(): IMoonlightHostStatus {
		if (this.uuid && this.name && this.httpsPort && this.type && this.version) {
			return {
				enabled: true,
				address: this.address,
				port: this.port,
				uuid: this.uuid,
				name: this.name,
				codecs: this.codecs,
				httpsPort: this.httpsPort,
				type: this.type,
				version: this.version,
			};
		}
		return {
			enabled: false,
			address: this.address,
			port: this.port,
		};
	}

	asMachine(): IMachine | null {
		if (!this.uuid) {
			return null;
		}

		let state = MachineState.UNPAIRED;
		if (this.pairAbort) {
			state = MachineState.PAIRING;
		}
		if (this.isHttpsSupported) {
			state = MachineState.PAIRED;
		}

		return {
			uuid: this.uuid,
			address: this.address,
			name: this.name || undefined,
			state,
			type: this.type || undefined,
			apps: this.apps,
		};
	}

	getAddress() {
		return {
			address: this.address,
			port: this.port,
		};
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

	private async saveInfo(data: IMoonlightHostDiskInfo) {
		const storageFile = this.getStorageFile();
		this.logger.log(`Saving info to disk... (${storageFile})`);
		this.diskData = data;

		await promisify(mkdir)(MoonlightHost.getStorageDir(), {
			recursive: true,
		});
		await promisify(writeFile)(storageFile, JSON.stringify(data, null, 2));
	}

	private async restoreInfo() {
		const storageFile = this.getStorageFile();
		this.logger.log("Reading info from disk...");
		const data = await promisify(readFile)(storageFile);
		const json = JSON.parse(data.toString("utf-8")) as IMoonlightHostDiskInfo;
		this.logger.log("Successfully read info from disk:", json);
		this.diskData = json;
	}

	async pair() {
		if (this.infoFetchAbort) {
			this.infoFetchAbort.abort();
		}
		const controller = new AbortController();
		try {
			if (this.pairAbort) {
				this.pairAbort.abort();
				this.pairAbort = null;
				this.emit("status", this.getStatus());
			}
			if (!this.version) {
				throw new Error("Server version unknown");
			}
			const isV7 = parseInt(this.version.split(".")[0]) >= 7;

			this.logger.log(
				`Beginning pair request to ${isV7 ? "V7+" : "Old"} server (${this.version}).`,
			);

			this.pairAbort = controller;
			this.emit("status", this.getStatus());

			const publicKey = await this.controller.getPublicKey();
			const uniqueId = await this.controller.getUniqueId();

			const pin = this.randomPin();
			const salt = crypto.randomBytes(16);
			const saltPin = Buffer.concat([salt, Buffer.from(pin, "ascii")]);

			this.ipc.send("pairing_code", pin, this.asMachine()!);

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
				root: IMoonlightServerCertificate;
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
				root: IMoonlightClientChallengeResponse;
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
				root: IMoonlightServerChallengeResponse;
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
				root: IMoonlightClientPairingCheck;
			};

			if (!xml5.paired) {
				throw new Error("Pairing failed at final step");
			}

			this.logger.log("Paired successfully");
			this.isHttpsSupported = true;

			await this.saveInfo({
				serverCert: serverCert.toString("base64"),
				address: this.address,
				port: this.port,
			});

			if (this.pairAbort == controller) {
				this.pairAbort = null;
			}
		} catch (e) {
			if (this.pairAbort == controller) {
				this.pairAbort = null;
				this.emit("status", this.getStatus());
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
			if (!this.diskData) {
				try {
					await this.restoreInfo();
				} catch (e) {
					throw new Error(
						"Cannot create secure Axios instance because server certificate is not available.",
					);
				}
			}

			serverCert = Buffer.from(this.diskData!.serverCert, "base64");
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
			baseURL: `https://${this.address}:${this.httpsPort}`,
			httpsAgent,
		});
	}

	public isPaired() {
		return this.isHttpsSupported;
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
}
