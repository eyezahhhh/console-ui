import MainToRendererHandler from "@type/main-to-renderer-handler.type";
import MainToRendererListener from "@type/main-to-renderer-listener.type";
import { Emitter, StandaloneEmitter } from "@shared/util/emitter.util";
import { contextBridge, ipcRenderer } from "electron";
import RendererToMainListener from "@type/renderer-to-main-listener.type";

console.log("Preload has loaded.");

class Ipc {
	private readonly emitter = new StandaloneEmitter<MainToRendererListener>();
	private readonly watchedEvents = new Set<keyof MainToRendererListener>();

	invoke = <T extends keyof MainToRendererHandler>(
		channel: T,
		...args: MainToRendererHandler[T][0]
	): Promise<MainToRendererHandler[T][1]> =>
		ipcRenderer.invoke(channel, ...args);

	send = <T extends keyof RendererToMainListener>(
		channel: T,
		...args: RendererToMainListener[T]
	) => {
		ipcRenderer.send(channel, ...args);
	};

	addEventListener = <K extends keyof MainToRendererListener>(
		event: K,
		callback: (...args: MainToRendererListener[K]) => void,
	) => {
		if (!this.watchedEvents.has(event)) {
			this.watchedEvents.add(event);
			ipcRenderer.addListener(
				event,
				(_event, ...args: MainToRendererListener[K]) => {
					this.emitter.emit(event, ...args);
				},
			);
		}
		return this.emitter.addEventListener(event, callback);
	};

	removeEventListener = <K extends keyof MainToRendererListener>(
		event: K,
		callback: (...args: MainToRendererListener[K]) => void,
	) => {
		return this.emitter.removeEventListener(event, callback);
	};
}

const ipc = new Ipc();
export type ElectronIpc = typeof ipc;

contextBridge.exposeInMainWorld("ipc", ipc);
