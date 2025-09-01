import ISettings from "@interface/settings.interface";
import { Emitter } from "@util/emitter.util";
import { app } from "electron";
import { readFile, writeFile } from "fs";
import path from "path";
import { promisify } from "util";
import { StandaloneLogger } from "./logger";
import DEFAULT_SETTINGS from "@const/default-setting.const";
import MOONLIGHT_CODECS from "@const/moonlight-codecs.const";
import MOONLIGHT_PLATFORMS from "@const/moonlight-platforms.const";

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

type Events = {
	updated: [ISettings];
};

export default class Settings extends Emitter<Events> {
	private settings: ISettings = structuredClone(DEFAULT_SETTINGS);
	private readonly logger = new StandaloneLogger(this);

	constructor() {
		super();
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

	async validateAndSet(settings: ISettings) {
		try {
			this.logger.log("Starting to validate settings.", settings);
			const isNatural = (number: number) => {
				return (
					typeof number == "number" &&
					!isNaN(number) &&
					Number.isInteger(number) &&
					number > 0
				);
			};

			if (
				typeof settings.moonlightCommand != "string" ||
				!settings.moonlightCommand.length
			) {
				this.logger.warn(`"moonlightCommand" invalid`);
				settings.moonlightCommand = DEFAULT_SETTINGS.moonlightCommand;
			}

			if (
				!Array.isArray(settings.resolution) ||
				settings.resolution.length != 2 ||
				settings.resolution.some((num) => !isNatural(num))
			) {
				this.logger.warn(`"resolution" invalid`);
				settings.resolution = DEFAULT_SETTINGS.resolution;
			}

			if (![0, 90, 180, 270].includes(settings.rotation)) {
				this.logger.warn(`"rotation" invalid`);
				settings.rotation = DEFAULT_SETTINGS.rotation;
			}

			if (!isNatural(settings.fps)) {
				this.logger.warn(`"fps" invalid`);
				settings.fps = DEFAULT_SETTINGS.fps;
			}

			if (!isNatural(settings.bitrate)) {
				this.logger.warn(`"bitrate" invalid`);
				settings.bitrate = DEFAULT_SETTINGS.bitrate;
			}

			if (!isNatural(settings.packetSize)) {
				this.logger.warn(`"packetSize" invalid`);
				settings.packetSize = DEFAULT_SETTINGS.packetSize;
			}

			if (!MOONLIGHT_CODECS.includes(settings.codec)) {
				this.logger.warn(`"codec" invalid`);
				settings.codec = DEFAULT_SETTINGS.codec;
			}

			if (typeof settings.hdr != "boolean") {
				this.logger.warn(`"hdr" invalid`);
				settings.hdr = DEFAULT_SETTINGS.hdr;
			}

			if (
				typeof settings.remoteOptimizations != "boolean" &&
				settings.remoteOptimizations != "auto"
			) {
				this.logger.warn(`"remoteOptimizations" invalid`);
				settings.remoteOptimizations = DEFAULT_SETTINGS.remoteOptimizations;
			}

			const surroundSound: ISettings["surroundSound"][] = [
				"none",
				"5.1",
				"7.1",
			];
			if (!surroundSound.includes(settings.surroundSound)) {
				this.logger.warn(`"surroundSound" invalid`);
				settings.surroundSound = DEFAULT_SETTINGS.surroundSound;
			}

			if (!MOONLIGHT_PLATFORMS.includes(settings.platform)) {
				this.logger.warn(`"platform" invalid`);
				settings.platform = DEFAULT_SETTINGS.platform;
			}

			if (typeof settings.quitAppAfter != "boolean") {
				this.logger.warn(`"quitAppAfter" invalid`);
				settings.quitAppAfter = DEFAULT_SETTINGS.quitAppAfter;
			}

			if (typeof settings.startFullscreen != "boolean") {
				this.logger.warn(`"startFullscreen" invalid`);
				settings.startFullscreen = DEFAULT_SETTINGS.startFullscreen;
			}

			if (typeof settings.kioskMode != "boolean") {
				this.logger.warn(`"kioskMode" invalid`);
				settings.kioskMode = DEFAULT_SETTINGS.kioskMode;
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
			this.logger.log(`Saved settings. ${this.getPath()}`);
			return true;
		} catch (e) {
			this.logger.error("Failed to save settings", e);
			return false;
		}
	}

	get() {
		return structuredClone(this.settings);
	}
}
