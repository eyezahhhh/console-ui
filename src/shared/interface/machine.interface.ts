import MachineState from "@enum/machine-state.enum";

export default interface IMachine {
	uuid: string;
	address: string;
	name?: string;
	state: MachineState;
	type?: "sunshine" | "gamestream";
}
