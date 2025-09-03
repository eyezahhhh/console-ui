import IMachine from "./machine.interface";

type IDiscoveredMachine = IMachine & {
	config: {
		discovered: true;
	};
};
export default IDiscoveredMachine;
