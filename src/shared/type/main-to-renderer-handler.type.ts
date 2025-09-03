import ISettings from "@interface/settings.interface";
import IMachine from "../interface/machine.interface";
import IAvailableUpdate from "@interface/available-update.interface";
import { ProgressInfo } from "electron-updater";

type MainToRendererHandler = {
	get_machines: [[], IMachine[]];
	get_settings: [[], ISettings];
	save_settings: [[ISettings], boolean];
	create_machine: [[string], boolean];
	get_is_update_checking: [[], boolean];
	get_available_update: [[], IAvailableUpdate | null];
	get_update_status: [[], [boolean, ProgressInfo | null]];
	get_version: [[], string];
	get_app_image: [[IMachine, number], [string, boolean] | null];
};
export default MainToRendererHandler;
