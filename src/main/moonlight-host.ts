import { XMLParser } from "fast-xml-parser";
import Axios, { AxiosInstance, CanceledError } from "axios";
import ISunshineServerInfo from "../shared/interface/sunshine-server-info.interface";
import SunshineCodec from "../shared/enum/sunshine-codec";
import IMachine from "../shared/interface/machine.interface";
import IMoonlightHostStatus from "../shared/interface/moonlight-host-status.interface";
import { StandaloneLogger } from "./logger";

export default class MoonlightHost {
	private readonly axios: AxiosInstance;
	private uuid: string | null = null;
	private name: string | null = null;
	private codecs: SunshineCodec[] = [];
	private httpsPort: number | null = null;
	private type: "sunshine" | "gamestream" | null = null;
	private updateListeners = new Set<(status: IMoonlightHostStatus) => void>();
	private infoFetchAbort: AbortController | null = null;
	private logger: StandaloneLogger;

	constructor(
		private readonly address: string,
		private readonly port: number,
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

			this.uuid = xml.uniqueid;
			this.codecs = codecs;
			this.name = xml.hostname;
			this.httpsPort = xml.HttpsPort;
			this.type = xml.mac == "00:00:00:00:00:00" ? "sunshine" : "gamestream"; // sunshine doesn't pass real mac address
			this.emitUpdate();

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
		if (this.uuid && this.name && this.httpsPort && this.type) {
			return {
				enabled: true,
				address: this.address,
				port: this.port,
				uuid: this.uuid,
				name: this.name,
				codecs: this.codecs,
				httpsPort: this.httpsPort,
				type: this.type,
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
}
