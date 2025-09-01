import { autoUpdater, ProgressInfo } from "electron-updater";
import { IpcMain } from "./ipc";
import IAvailableUpdate from "@interface/available-update.interface";
import { StandaloneLogger } from "./logger";
import { Emitter } from "@util/emitter.util";

autoUpdater.autoDownload = false;
autoUpdater.forceDevUpdateConfig = true;

type Events = {
	available_update: [IAvailableUpdate | null];
	is_checking: [boolean];
	update_status: [boolean, ProgressInfo | null];
};

export default class Updater extends Emitter<Events> {
	private readonly logger = new StandaloneLogger(this);
	private availableUpdate: IAvailableUpdate | null = null;
	private checking = false;
	private downloading = false;
	private downloadProgress: ProgressInfo | null = null;

	constructor(private readonly ipc: IpcMain) {
		super();
		autoUpdater.logger = this.logger;

		this.addEventListener("available_update", () => {
			this.checking = false;
			this.emit("is_checking", this.checking);
			this.ipc.send("available_update", this.availableUpdate);
		});

		this.addEventListener("is_checking", () => {
			this.ipc.send("is_update_checking", this.checking);
		});

		this.addEventListener("update_status", (downloading, progress) => {
			this.ipc.send("update_status", downloading, progress);
		});

		this.ipc.addEventListener("check_updates", () => {
			if (!this.checking) {
				autoUpdater.checkForUpdates();
			}
		});

		this.ipc.addEventListener("start_update", () => {
			if (this.downloading) {
				this.logger.warn(
					"Attempted to start app update when app is already updating.",
				);
				return;
			}
			this.logger.log("Starting app update");

			this.downloading = true;
			this.downloadProgress = null;
			this.emit("update_status", this.downloading, this.downloadProgress);
			autoUpdater.downloadUpdate();
		});

		autoUpdater.on("error", (error) => {
			this.logger.error(error);
			this.availableUpdate = null;
			this.emit("available_update", this.availableUpdate);
		});

		autoUpdater.on("update-available", (info) => {
			this.logger.log("New update available:", info);
			this.availableUpdate = {
				version: info.version,
				dateReleased: info.releaseDate,
			};
			this.emit("available_update", this.availableUpdate);
		});

		autoUpdater.on("checking-for-update", () => {
			this.checking = true;
			this.emit("is_checking", this.checking);
		});

		autoUpdater.on("update-not-available", () => {
			this.emit("available_update", null);
		});

		autoUpdater.on("download-progress", (info) => {
			this.downloading = true;
			this.downloadProgress = info;
			this.emit("update_status", this.downloading, this.downloadProgress);
		});

		autoUpdater.on("update-downloaded", () => {
			autoUpdater.quitAndInstall(false, true);
		});

		this.logger.log("Updater is loaded.");
		autoUpdater.checkForUpdates();
	}

	getAvailableUpdate() {
		return this.availableUpdate;
	}

	isChecking() {
		return this.checking;
	}

	isDownloading() {
		return this.downloading;
	}

	getDownloadProgress() {
		return this.downloadProgress;
	}
}
