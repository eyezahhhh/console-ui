import { app, BrowserWindow, ipcMain, Menu, Tray } from "electron";
import Path from "path";
import { StandaloneLogger } from "./logger";
import path from "path";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import { IpcMain } from "./ipc";

const logger = new StandaloneLogger("Main");

const IS_DEV = process.env.NODE_ENV == "development";
if (IS_DEV) {
	logger.log("App is starting in development mode.");
} else {
	logger.log("App is starting in production mode.");
}

let getMoonlight: () => MoonlightEmbeddedController;

const ipc = new IpcMain(
	{
		get_machines: async () => {
			return getMoonlight().getMachines();
		},
	},
	IS_DEV,
);

const moonlight = new MoonlightEmbeddedController("moonlight-embedded", ipc);
getMoonlight = () => moonlight;

app.whenReady().then(() => {
	ipc.getOrCreateWindow();

	const tray = new Tray(path.join(__dirname, "..", "..", "assets", "tray.png"));
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Show App",
			click: () => {
				logger.log("System tray as requested the app is shown");
			},
		},
		{
			label: "Quit",
			click: () => {
				app.quit();
			},
		},
	]);
	tray.setContextMenu(contextMenu);
});

app.on("window-all-closed", () => {
	if (!moonlight.isStreaming()) {
		logger.log(
			"All windows are closed and Moonlight isn't streaming, exiting.",
		);
		app.quit();
	}
});
