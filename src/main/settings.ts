import ISettings from "@interface/settings.interface";
import MoonlightCodec from "@type/moonlight-codec.type";
import { Emitter } from "@util/emitter.util";
import { app } from "electron";
import { readFile, writeFile } from "fs";
import path from "path";
import { promisify } from "util";
import { StandaloneLogger } from "./logger";

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

const DEFAULT_SETTINGS: ISettings = {
	moonlightCommand: "moonlight",
	resolution: [1280, 720],
	rotation: 0,
	fps: 60,
	bitrate: 20,
	packetSize: 100,
	codec: "auto",
	hdr: false,
	remoteOptimizations: "auto",
	surroundSound: "none",
	platform: "auto",
	quitAppAfter: false,
};

type Events = {
	updated: [ISettings];
};

export default class Settings extends Emitter<Events> {
	private settings: ISettings = structuredClone(DEFAULT_SETTINGS);
	private readonly logger = new StandaloneLogger(this);

	constructor() {
		super();
		this.read().catch((error) => this.logger.error(error));
	}

	private getPath() {
		return path.join(app.getPath("userData"), "settings.json");
	}

	async read() {
		try {
			const data = await readFileAsync(this.getPath(), "utf-8");
			const json = JSON.parse(data) as ISettings;
			const valid = await this.validateAndSet(json);
			if (!valid) {
				throw new Error("Failed to validate and save settings");
			}
			this.logger.log("Successfully loaded settings from disk.");
		} catch (e) {
			this.logger.log(
				"Failed to load settings from disk. Restoring default settings.",
				e,
			);
			await this.validateAndSet(DEFAULT_SETTINGS);
		}
	}

	private async validateAndSet(settings: ISettings) {
		try {
			const isNatural = (number: number) => {
				return (
					typeof number == "number" &&
					!isNaN(number) &&
					Number.isInteger(number) &&
					number > 0
				);
			};

			if (
				typeof settings.moonlightCommand ||
				!settings.moonlightCommand.length
			) {
				return false;
			}

			if (
				!Array.isArray(settings.resolution) ||
				settings.resolution.length != 2 ||
				settings.resolution.some((num) => !isNatural(num))
			) {
				return false;
			}

			if (![0, 90, 180, 270].includes(settings.rotation)) {
				return false;
			}

			if (!isNatural(settings.fps)) {
				return false;
			}

			if (!isNatural(settings.bitrate)) {
				return false;
			}

			if (!isNatural(settings.packetSize)) {
				return false;
			}

			const codecs: MoonlightCodec[] = ["auto", "av1", "h264", "h265"];
			if (!codecs.includes(settings.codec)) {
				return false;
			}

			if (typeof settings.hdr != "boolean") {
				return false;
			}

			if (
				typeof settings.remoteOptimizations != "boolean" &&
				settings.remoteOptimizations != "auto"
			) {
				return false;
			}

			const surroundSound: ISettings["surroundSound"][] = [
				"none",
				"5.1",
				"7.1",
			];
			if (!surroundSound.includes(settings.surroundSound)) {
				return false;
			}

			const platforms: MoonlightPlatform[] = [
				"aml",
				"auto",
				"fake",
				"imx",
				"pi",
				"rk",
				"sdl",
				"x11",
				"x11_vdpau",
			];
			if (!platforms.includes(settings.platform)) {
				return false;
			}

			if (typeof settings.quitAppAfter != "boolean") {
				return false;
			}

			const keys = Object.keys(DEFAULT_SETTINGS) as (keyof ISettings)[];
			const clone = structuredClone(settings);
			for (let key of Object.keys(clone)) {
				if (!keys.includes(key as keyof ISettings)) {
					delete clone[key as keyof ISettings];
				}
			}
			await writeFileAsync(this.getPath(), JSON.stringify(clone, null, 2));
			this.settings = clone;
			this.emit("updated", clone);
			return true;
		} catch (e) {
			this.logger.error("Failed to save settings", e);
			return false;
		}
	}
}
