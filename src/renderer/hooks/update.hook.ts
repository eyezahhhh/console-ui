import IAvailableUpdate from "@interface/available-update.interface";
import { StandaloneEmitter } from "@util/emitter.util";
import type { ProgressInfo } from "electron-updater";
import { useEffect, useState } from "react";

type Events = {
	available_update: [IAvailableUpdate | null];
	is_checking: [boolean];
	update_status: [[boolean, ProgressInfo | null]];
};

const emitter = new StandaloneEmitter<Events>();
let _availableUpdate: IAvailableUpdate | null = null;
let _isChecking = false;
let _updateStatus: [boolean, ProgressInfo | null] = [false, null];
const setAvailableUpdate = (update: IAvailableUpdate | null) => {
	_availableUpdate = update;
	emitter.emit("available_update", update);
};
const setIsChecking = (isChecking: boolean) => {
	_isChecking = isChecking;
	emitter.emit("is_checking", isChecking);
};
const setUpdateStatus = (status: [boolean, ProgressInfo | null]) => {
	_updateStatus = status;
	emitter.emit("update_status", status);
};

window.ipc.invoke("get_available_update").then(setAvailableUpdate);
window.ipc.addEventListener("available_update", setAvailableUpdate);
window.ipc.invoke("get_is_update_checking").then(setIsChecking);
window.ipc.addEventListener("is_update_checking", setIsChecking);
window.ipc.invoke("get_update_status").then(setUpdateStatus);
window.ipc.addEventListener("update_status", (...args) =>
	setUpdateStatus(args),
);

export default function useUpdate() {
	const [availableUpdate, setAvailableUpdate] =
		useState<IAvailableUpdate | null>(_availableUpdate);
	const [isChecking, setIsChecking] = useState(_isChecking);
	const [[isDownloading, downloadProgress], setUpdateStatus] =
		useState(_updateStatus);

	useEffect(() => {
		emitter.addEventListener("available_update", setAvailableUpdate);
		emitter.addEventListener("is_checking", setIsChecking);
		emitter.addEventListener("update_status", setUpdateStatus);

		return () => {
			emitter.removeEventListener("available_update", setAvailableUpdate);
			emitter.removeEventListener("is_checking", setIsChecking);
			emitter.removeEventListener("update_status", setUpdateStatus);
		};
	}, []);

	return {
		availableUpdate,
		isChecking,
		isDownloading,
		downloadProgress,
	};
}
