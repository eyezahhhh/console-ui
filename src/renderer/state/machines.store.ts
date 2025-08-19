import { create } from "zustand";
import IMachine from "../../shared/interface/machine.interface";

interface IMachinesStoreState {
	machines: IMachine[];
}

const useMachinesStore = create<IMachinesStoreState>((set, get) => ({
	machines: [],
}));

export default useMachinesStore;

useMachinesStore.setState({
	machines: [
		{
			address: "192.168.68.56",
			name: "Gigabox Gaming",
		},
		{
			address: "192.168.68.130",
			name: "Charlie's PC",
		},
	],
});
