import ISettings from "@interface/settings.interface";
import IMachine from "../interface/machine.interface";

type MainToRendererListener = {
	machines: [IMachine[]];
	pairing_code: [string, IMachine];
	settings: [ISettings];
};
export default MainToRendererListener;
