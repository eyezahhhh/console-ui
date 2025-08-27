import { BrowserWindow, ipcMain } from "electron";
import MainToRendererListener from "@type/main-to-renderer-listener.type";
import MainToRendererHandler from "@type/main-to-renderer-handler.type";
import TupleToFunctionAsync from "@type/tuple-to-function-async.type";
import { StandaloneLogger } from "./logger";
import { Emitter, StandaloneEmitter } from "@util/emitter.util";
import RendererToMainListener from "@type/renderer-to-main-listener.type";

type Transform<T extends Record<string, [any[], any]>> = {
	[K in keyof T]: TupleToFunctionAsync<T[K]>;
};

export class IpcMain {
	private readonly logger = new StandaloneLogger(IpcMain);
	private window: BrowserWindow | null = null;
	private readonly emitter = new StandaloneEmitter<RendererToMainListener>();
	private readonly watchedEvents = new Set<keyof RendererToMainListener>();

	constructor(private readonly handlers: Transform<MainToRendererHandler>) {
		for (let [channel, callback] of Object.entries(handlers)) {
			this.logger.log(`Registered handler for channel "${channel}"`);
			ipcMain.handle(channel, (event, ...args) => {
				// @ts-expect-error
				return callback(...args);
			});
		}
	}

	send<T extends keyof MainToRendererListener>(
		event: T,
		...args: MainToRendererListener[T]
	) {
		if (this.window) {
			this.logger.log("Sending event to renderer:", event);
			this.window.webContents.send(event, ...args);
		} else {
			this.logger.log(
				"Not sending event to renderer because window doesn't exist:",
				event,
			);
		}
	}

	setWindow(window: BrowserWindow | null) {
		this.window = window;
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
					this.logger.log("NEW EVENT", event, args);
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
