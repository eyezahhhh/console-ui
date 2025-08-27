import { app, BrowserWindow } from "electron";
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

const ipc = new IpcMain({
	get_machines: async () => {
		console.log("Getting machines...", getMoonlight().getMachines());
		return getMoonlight().getMachines();
	},
});

const moonlight = new MoonlightEmbeddedController("moonlight-embedded", ipc);
getMoonlight = () => moonlight;

function createWindow() {
	const window = new BrowserWindow({
		width: 800,
		height: 480,
		fullscreen: false,
		// frame: false,
		webPreferences: {
			nodeIntegration: true,
			devTools: IS_DEV,
			preload: path.join(__dirname, "preload.js"),
		},
	});
	ipc.setWindow(window);

	if (IS_DEV) {
		const url = "http://localhost:5173";
		logger.log(`Loading window with URL`, url);
		window.loadURL(url);
	} else {
		window.loadFile(Path.join(__dirname, "..", "renderer", "index.html"));
	}
}

app.whenReady().then(createWindow);
