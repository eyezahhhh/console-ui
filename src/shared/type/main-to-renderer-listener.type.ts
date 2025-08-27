import IMachine from "../interface/machine.interface";

type MainToRendererListener = {
	machines: [IMachine[]];
	pairing_code: [string, IMachine];
};
export default MainToRendererListener;
