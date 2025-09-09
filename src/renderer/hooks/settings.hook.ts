import { useEffect, useState } from "react";
import { StandaloneEmitter } from "@util/emitter.util";
import ISettings from "@interface/settings.interface";
import DEFAULT_SETTINGS from "@const/default-setting.const";

const emitter = new StandaloneEmitter<{ settings: [ISettings] }>();
let settings: ISettings = structuredClone(DEFAULT_SETTINGS);
const updateSettings = (newSettings: ISettings) => {
	settings = newSettings;
	emitter.emit("settings", settings);
};

window.ipc.invoke("get_settings").then(updateSettings);
window.ipc.addEventListener("settings", updateSettings);

export default function useSettings() {
	const [cache, setCache] = useState(settings);

	useEffect(() => {
		emitter.addEventListener("settings", setCache);

		return () => {
			emitter.removeEventListener("settings", setCache);
		};
	}, []);

	return cache;
}
