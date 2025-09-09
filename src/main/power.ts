import { execSync } from "child_process";
import { StandaloneLogger } from "./logger";

const logger = new StandaloneLogger("Power");

export function shutdown() {
	try {
		if (process.platform == "win32") {
			execSync("shutdown /s /t 0");
		} else if (process.platform == "linux" || process.platform == "darwin") {
			execSync("shutdown -h now");
		}
	} catch (e) {
		logger.error(e);
	}
}

export function reboot() {
	try {
		if (process.platform == "win32") {
			execSync("shutdown /r /t 0");
		} else if (process.platform == "linux" || process.platform == "darwin") {
			execSync("shutdown -r now");
		}
	} catch (e) {
		logger.error(e);
	}
}

export function suspend() {
	try {
		if (process.platform === "win32") {
			execSync("rundll32.exe powrprof.dll,SetSuspendState 0,1,0");
		} else if (process.platform === "linux" || process.platform === "darwin") {
			execSync("systemctl suspend");
		}
	} catch (e) {
		logger.error(e);
	}
}
