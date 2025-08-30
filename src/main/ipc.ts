import { BrowserWindow, ipcMain } from "electron";
import MainToRendererListener from "@type/main-to-renderer-listener.type";
import MainToRendererHandler from "@type/main-to-renderer-handler.type";
import TupleToFunctionAsync from "@type/tuple-to-function-async.type";
import { StandaloneLogger } from "./logger";
import { Emitter, StandaloneEmitter } from "@util/emitter.util";
import RendererToMainListener from "@type/renderer-to-main-listener.type";
import path from "path";
import Settings from "./settings";

type Transform<T extends Record<string, [any[], any]>> = {
	[K in keyof T]: TupleToFunctionAsync<T[K]>;
};

export class IpcMain {
	private readonly logger = new StandaloneLogger(IpcMain);
	private window: BrowserWindow | null = null;
	private readonly emitter = new StandaloneEmitter<RendererToMainListener>();
	private readonly watchedEvents = new Set<keyof RendererToMainListener>();

	constructor(
		private readonly handlers: Transform<MainToRendererHandler>,
		private readonly isDev: boolean,
		private readonly settings: Settings,
	) {
		for (let [channel, callback] of Object.entries(handlers)) {
			this.logger.log(`Registered handler for channel "${channel}"`);
			ipcMain.handle(channel, (event, ...args) => {
				return callback(...args);
			});
		}
	}

	send<T extends keyof MainToRendererListener>(
		event: T,
		...args: MainToRendererListener[T]
	) {
		if (this.window) {
			this.window.webContents.send(event, ...args);
		} else {
			this.logger.log(
				"Not sending event to renderer because window doesn't exist:",
				event,
			);
		}
	}

	getOrCreateWindow(urlHash = "/") {
		if (this.window) {
			return this.window;
		}

		const window = new BrowserWindow({
			width: 800,
			height: 480,
			fullscreen: this.settings.get().startFullscreen,
			// frame: false,
			webPreferences: {
				nodeIntegration: true,
				devTools: this.isDev,
				preload: path.join(__dirname, "preload.js"),
			},
		});
		this.window = window;

		window.addListener("closed", () => {
			this.logger.log("Window has closed.");
			this.window = null;
		});

		if (this.isDev) {
			const url = `http://localhost:5173#${urlHash}`;
			this.logger.log(`Loading window with URL`, url);
			window.loadURL(url);
		} else {
			window.loadFile(path.join(__dirname, "..", "renderer", "index.html"), {
				hash: urlHash,
			});
		}

		return window;
	}

	getWindow() {
		return this.window;
	}

	addEventListener = <K extends keyof RendererToMainListener>(
		event: K,
		callback: (...args: RendererToMainListener[K]) => void,
	) => {
		if (!this.watchedEvents.has(event)) {
			this.watchedEvents.add(event);
			this.logger.log(`Starting to watch event "${event}".`);
			ipcMain.addListener(
				event,
				(_event, ...args: RendererToMainListener[K]) => {
					this.emitter.emit(event, ...args);
				},
			);
		}
		return this.emitter.addEventListener(event, callback);
	};

	removeEventListener = <K extends keyof RendererToMainListener>(
		event: K,
		callback: (...args: RendererToMainListener[K]) => void,
	) => {
		return this.emitter.removeEventListener(event, callback);
	};
}
