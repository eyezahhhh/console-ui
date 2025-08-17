import { app, BrowserWindow } from "electron";
import Path from "path";

const IS_DEV = process.env.NODE_ENV == "development";
if (IS_DEV) {
	console.log("App is starting in development mode!");
}

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 480,
		fullscreen: false,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			devTools: IS_DEV,
		},
	});

	if (IS_DEV) {
		win.loadURL("http://localhost:5173");
	} else {
		win.loadFile(Path.join(__dirname, "..", "renderer", "index.html"));
	}
}

app.whenReady().then(createWindow);
