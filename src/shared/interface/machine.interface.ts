import MachineState from "@enum/machine-state.enum";
import ISunshineApp from "./sunshine-app.interface";

export default interface IMachine {
	uuid: string;
	address: string;
	name?: string;
	state: MachineState;
	type?: "sunshine" | "gamestream";
	apps: ISunshineApp[];
}
