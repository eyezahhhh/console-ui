import { execSync } from "child_process";

export function shutdown() {
	if (process.platform == "win32") {
		execSync("shutdown /s /t 0");
	} else if (process.platform == "linux" || process.platform == "darwin") {
		execSync("shutdown -h now");
	}
}

export function reboot() {
	if (process.platform == "win32") {
		execSync("shutdown /r /t 0");
	} else if (process.platform == "linux" || process.platform == "darwin") {
		execSync("shutdown -r now");
	}
}

export function suspend() {
	if (process.platform === "win32") {
		execSync("rundll32.exe powrprof.dll,SetSuspendState 0,1,0");
	} else if (process.platform === "linux" || process.platform === "darwin") {
		execSync("systemctl suspend");
	}
}
