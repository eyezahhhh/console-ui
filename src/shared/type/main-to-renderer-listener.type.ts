import ISettings from "@interface/settings.interface";
import IMachine from "../interface/machine.interface";
import IAvailableUpdate from "@interface/available-update.interface";
import { ProgressInfo } from "electron-updater";
import IDiscoveredMachine from "@interface/discovered-machine.interface";
import IPowerSupply from "@interface/power-supply.interface";

type MainToRendererListener = {
	machines: [IMachine[]];
	pairing_code: [string, IDiscoveredMachine];
	settings: [ISettings];
	available_update: [IAvailableUpdate | null];
	is_update_checking: [boolean];
	update_status: [boolean, ProgressInfo | null];
	power_supplies: [IPowerSupply[]];
};
export default MainToRendererListener;
