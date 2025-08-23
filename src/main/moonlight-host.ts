import { XMLParser } from "fast-xml-parser";
import Axios, { AxiosInstance, CanceledError } from "axios";
import ISunshineServerInfo from "../shared/interface/sunshine-server-info.interface";
import SunshineCodec from "../shared/enum/sunshine-codec";
import IMachine from "../shared/interface/machine.interface";
import IMoonlightHostStatus from "../shared/interface/moonlight-host-status.interface";
import { StandaloneLogger } from "./logger";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import crypto from "crypto";
import IMoonlightServerCertificate from "../shared/interface/moonlight-server-certificate.interface";
import IMoonlightClientChallengeResponse from "../shared/interface/moonlight-client-challenge-response.interface";
import forge from "node-forge";
import IMoonlightServerChallengeResponse from "../shared/interface/moonlight-server-challenge-response.interface";
import IMoonlightHostDiskInfo from "../shared/interface/moonlight-host-disk-info.interface";
import IMoonlightClientPairingCheck from "../shared/interface/moonlight-client-pairing-check.interface";
import { mkdir, readFile, writeFile } from "fs";
import { app } from "electron";
import path from "path";
import { promisify } from "util";

export default class MoonlightHost {
	private readonly axios: AxiosInstance;
	private uuid: string | null = null;
	private name: string | null = null;
	private codecs: SunshineCodec[] = [];
	private httpsPort: number | null = null;
	private type: "sunshine" | "gamestream" | null = null;
	private version: string | null = null;
	private updateListeners = new Set<(status: IMoonlightHostStatus) => void>();
	private infoFetchAbort: AbortController | null = null;
	private logger: StandaloneLogger;
	private diskData: IMoonlightHostDiskInfo | null = null;

	constructor(
		private readonly address: string,
		private readonly port: number,
		private readonly controller: MoonlightEmbeddedController,
	) {
		this.axios = Axios.create({
			baseURL: `http://${address}:${port}`,
		});
		this.logger = new StandaloneLogger(`Moonlight ${address}:${port}`);
		this.logger.log(`Created new Moonlight host`);

		this.fetchServerInfo().catch((error) => this.logger.error(error));
	}

	async fetchServerInfo() {
		if (this.infoFetchAbort) {
			this.infoFetchAbort.abort();
		}

		const oldStatus = this.getStatus();

		try {
			const controller = new AbortController();

			const response = await this.axios.get("serverinfo", {
				signal: controller.signal,
			});

			if (response.status != 200) {
				throw new Error(`/serverinfo response status was ${response.status}`);
			}

			const parser = new XMLParser();
			const { root: xml } = parser.parse(response.data) as {
				root: ISunshineServerInfo;
			};

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
					await this.readInfo();
				} catch (e) {
					this.logger.warn("Failed to read data from disk:", e);
				}
			}

			if (JSON.stringify(oldStatus) != JSON.stringify(this.getStatus())) {
				this.emitUpdate();
			}

			const timeout = setTimeout(() => {
				// queue up next info request
				if (!controller.signal.aborted) {
					this.fetchServerInfo().catch((error) => this.logger.error(error));
				}
			}, 10_000);
			controller.signal.addEventListener("abort", () => {
				clearTimeout(timeout);
			});
		} catch (e) {
			if (e instanceof CanceledError) {
				return;
			}
			this.name = null;
			this.emitUpdate();
			throw e;
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

		return {
			uuid: this.uuid,
			address: this.address,
			name: this.name || undefined,
		};
	}

	private emitUpdate() {
		for (let listener of this.updateListeners) {
			listener(this.getStatus());
		}
	}

	addListener(listener: (status: IMoonlightHostStatus) => void) {
		this.updateListeners.add(listener);
		return () => this.removeListener(listener);
	}

	removeListener(listener: (status: IMoonlightHostStatus) => void) {
		this.updateListeners.delete(listener);
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

	private getStorageDir() {
		return path.join(app.getPath("userData"), "gfe");
	}

	private getStorageFile() {
		if (!this.uuid) {
			throw new Error("UUID is unknown");
		}
		return path.join(this.getStorageDir(), `${this.uuid}.json`);
	}

	private async saveInfo(data: IMoonlightHostDiskInfo) {
		const storageFile = this.getStorageFile();
		console.log(storageFile);
		this.logger.log("Saving info to disk...");
		this.diskData = data;

		await promisify(mkdir)(this.getStorageDir(), {
			recursive: true,
		});
		await promisify(writeFile)(storageFile, JSON.stringify(data, null, 2));
	}

	private async readInfo() {
		const storageFile = this.getStorageFile();
		this.logger.log("Reading info from disk...");
		const data = await promisify(readFile)(storageFile);
		const json = JSON.parse(data.toString("utf-8")) as IMoonlightHostDiskInfo;
		this.logger.log("Successfully read info from disk:", json);
		this.diskData = json;
	}

	async pair() {
		if (!this.version) {
			throw new Error("Server version unknown");
		}
		const isV7 = parseInt(this.version.split(".")[0]) >= 7;

		this.logger.log(
			`Beginning pair request to ${isV7 ? "V7+" : "Old"} server (${this.version}).`,
		);

		// This is your client's public certificate, in hex format.
		const publicKey = await this.controller.getPublicKey();
		const uniqueId = await this.controller.getUniqueId();

		const pin = this.randomPin();
		const salt = crypto.randomBytes(16);
		const saltPin = Buffer.concat([salt, Buffer.from(pin, "ascii")]);

		console.log(`Making request, enter PIN ${pin}`);
		const response1 = await this.axios.get(`pair`, {
			params: new URLSearchParams({
				uniqueid: uniqueId,
				uuid: this.randomUUID(),
				devicename: "roth",
				updateState: "1",
				phrase: "getservercert",
				salt: salt.toString("hex"),
				clientcert: publicKey.toString("hex"), // Sent as hex
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

		// FIX 3: The C code always uses AES-128-ECB. The key derivation is what changes.
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
			aesAlgorithm, // Always use aes-128
			aesKey,
			null,
		);
		clientChallengeCipher.setAutoPadding(false); // No padding
		const clientChallengeHex = Buffer.concat([
			clientChallengeCipher.update(clientChallengePlain),
			clientChallengeCipher.final(),
		]).toString("hex");

		const response2 = await this.axios.get("pair", {
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
		decipher.setAutoPadding(false); // No padding for decryption either
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
		const clientPairingSecret = Buffer.concat([clientSecret, clientSignature]);
		await this.axios.get("pair", {
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

		const httpsAgent = await this.controller.createHttpsAgent({
			ca: serverCert,
			checkServerIdentity: () => undefined,
		});
		const secureAxios = Axios.create({
			baseURL: `https://${this.address}:${this.httpsPort}`,
			httpsAgent,
		});

		const response5 = await secureAxios.get("pair", {
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

		await this.saveInfo({
			serverCert: serverCert.toString("base64"),
			clientSecret: clientSecret.toString("base64"),
		});
	}

	// public getServerKey(options: {
	// 	salt?: Buffer;
	// } = {}) {
	// 	const uniqueId = await this.controller.getUniqueId();
	// 	const response = await this.axios.get("pair", {
	// 		params:
	// 	})
	// }

	public isPaired() {}

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
