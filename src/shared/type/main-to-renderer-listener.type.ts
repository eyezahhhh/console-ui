import ISettings from "@interface/settings.interface";
import IMachine from "../interface/machine.interface";
import IAvailableUpdate from "@interface/available-update.interface";
import { ProgressInfo } from "electron-updater";

type MainToRendererListener = {
	machines: [IMachine[]];
	pairing_code: [string, IMachine];
	settings: [ISettings];
	available_update: [IAvailableUpdate | null];
	is_update_checking: [boolean];
	update_status: [boolean, ProgressInfo | null];
};
export default MainToRendererListener;
