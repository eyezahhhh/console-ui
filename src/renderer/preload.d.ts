import type { ElectronIpc } from "../main/preload";

declare global {
	interface Window {
		ipc: ElectronIpc;
	}
}

export {};
