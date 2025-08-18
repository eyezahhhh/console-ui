import { app, BrowserWindow } from "electron";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import Path from "path";
import { StandaloneLogger } from "@logger";

const logger = new StandaloneLogger("Main");

const IS_DEV = process.env.NODE_ENV == "development";
if (IS_DEV) {
	logger.log("App is starting in development mode.");
} else {
	logger.log("App is starting in production mode.");
}

const moonlight = new MoonlightEmbeddedController("moonlight-embedded");

logger.error("Fail!!");

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 480,
		fullscreen: false,
		// frame: false,
		webPreferences: {
			nodeIntegration: true,
			devTools: IS_DEV,
		},
	});

	if (IS_DEV) {
		const url = "http://localhost:5173";
		logger.log(`Loading window with URL`, url);
		win.loadURL(url);
	} else {
		win.loadFile(Path.join(__dirname, "..", "renderer", "index.html"));
	}
}

app.whenReady().then(createWindow);
