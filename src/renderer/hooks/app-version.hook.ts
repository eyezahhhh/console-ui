import { StandaloneEmitter } from "@util/emitter.util";
import { useEffect, useState } from "react";

const emitter = new StandaloneEmitter<{
	version: [string];
}>();
let _appVersion = "v0.0.0";

window.ipc.invoke("get_version").then((version) => {
	_appVersion = version;
	emitter.emit("version", version);
	console.log("App version:", version);
});

export default function useAppVersion() {
	const [version, setVersion] = useState(_appVersion);

	useEffect(() => {
		emitter.addEventListener("version", setVersion);

		return () => {
			emitter.removeEventListener("version", setVersion);
		};
	}, []);

	return version;
}
