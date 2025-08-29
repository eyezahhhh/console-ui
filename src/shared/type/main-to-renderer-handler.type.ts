import ISettings from "@interface/settings.interface";
import IMachine from "../interface/machine.interface";

type MainToRendererHandler = {
	get_machines: [[], IMachine[]];
	get_settings: [[], ISettings];
	save_settings: [[ISettings], boolean];
	create_machine: [[string], boolean];
};
export default MainToRendererHandler;
