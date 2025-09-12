import { app, Menu, Tray } from "electron";
import { StandaloneLogger } from "./logger";
import path from "path";
import { MoonlightEmbeddedController } from "./moonlight-embedded-controller";
import { IpcMain } from "./ipc";
import Settings from "./settings";
import Updater from "./updater";
import { reboot, shutdown, suspend } from "./power";
import { spawn } from "child_process";
import PowerSupply from "./power-supply/power-supply-manager";

const logger = new StandaloneLogger("Main");

const IS_DEV = process.env.NODE_ENV == "development";
if (IS_DEV) {
	logger.log("App is starting in development mode.");
} else {
	logger.log("App is starting in production mode.");
}

const exceptionLogger = new StandaloneLogger("UncaughtException");
process.on("uncaughtException", (e) => {
	exceptionLogger.error("An unhandled error occurred:", e);
});
const rejectionLogger = new StandaloneLogger("UnhandledRejection");
process.on("unhandledRejection", (e) => {
	rejectionLogger.error("An unhandled rejection occurred:", e);
});

const settings = new Settings();

Promise.all([app.whenReady(), settings.read()]).then(() => {
	let getMoonlight: () => MoonlightEmbeddedController;
	let getUpdater: () => Updater;
	let getPowerSupply: () => PowerSupply;

	const ipc = new IpcMain(
		{
			get_machines: async () => {
				return getMoonlight().getMachines();
			},
			get_app_image: async (machine, appId) => {
				const host = getMoonlight()
					.getHosts()
					.find((host) => host.getAddress() == machine.config.address);
				if (!host) {
					return null;
				}
				return host.getAppImage(appId);
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
					getMoonlight().addHost(parts[0], {
						port,
						known: true, // manually added hosts should show up immediately, even if they don't actually exist
					});
					return true;
				} catch (e) {
					logger.error("Failed to create Moonlight host:", e);
					return false;
				}
			},
			get_available_update: () => getUpdater().getAvailableUpdate(),
			get_is_update_checking: () => getUpdater().isChecking(),
			get_update_status: () => [
				getUpdater().isDownloading(),
				getUpdater().getDownloadProgress(),
			],
			get_version: () => app.getVersion(),
			get_power_supplies: () => getPowerSupply().getPowerSupplies(),
		},
		IS_DEV,
		settings,
	);
	const updater = new Updater(ipc);
	getUpdater = () => updater;

	const powerSupply = new PowerSupply(ipc);
	getPowerSupply = () => powerSupply;

	ipc.addEventListener("quit", () => {
		const command = settings.get().exitCommand;
		if (command) {
			const child = spawn(command, {
				stdio: ["ignore", "ignore", "ignore"],
				detached: true,
			});
			child.unref();
		}
		app.quit();
	});
	ipc.addEventListener("restart", () => {
		app.relaunch();
		app.quit();
	});

	ipc.addEventListener("shutdown", () => shutdown());
	ipc.addEventListener("reboot", () => reboot());
	ipc.addEventListener("suspend", () => suspend());

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
