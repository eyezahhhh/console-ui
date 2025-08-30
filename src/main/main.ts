import { app, Menu, Tray } from "electron";
import { StandaloneLogger } from "./logger";
import path from "path";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import { IpcMain } from "./ipc";
import Settings from "./settings";

const logger = new StandaloneLogger("Main");

const IS_DEV = process.env.NODE_ENV == "development";
if (IS_DEV) {
	logger.log("App is starting in development mode.");
} else {
	logger.log("App is starting in production mode.");
}

const settings = new Settings();

Promise.all([app.whenReady(), settings.read()]).then(() => {
	let getMoonlight: () => MoonlightEmbeddedController;

	const ipc = new IpcMain(
		{
			get_machines: async () => {
				return getMoonlight().getMachines();
			},
			get_settings: () => settings.get(),
			save_settings: (newSettings) => settings.validateAndSet(newSettings),
			create_machine: (address) => {
				try {
					const parts = address.split(":");
					let port: number | undefined = undefined;
					if (parts.length >= 2) {
						let part = parseFloat(parts[1]);
						if (!isNaN(part) && Number.isInteger(part)) {
							port = part;
						}
					}
					getMoonlight().addHost(parts[0], port);
					return true;
				} catch (e) {
					logger.error("Failed to create Moonlight host:", e);
					return false;
				}
			},
		},
		IS_DEV,
		settings,
	);

	ipc.addEventListener("quit", () => {
		app.quit();
	});

	settings.addEventListener("updated", (settings) =>
		ipc.send("settings", settings),
	);

	const moonlight = new MoonlightEmbeddedController(settings, ipc);
	getMoonlight = () => moonlight;

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

	app.on("window-all-closed", () => {
		if (!moonlight.isStreaming()) {
			logger.log(
				"All windows are closed and Moonlight isn't streaming, exiting.",
			);
			app.quit();
		}
	});
});
