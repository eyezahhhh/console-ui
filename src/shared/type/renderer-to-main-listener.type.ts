import IMachine from "@interface/machine.interface";

type RendererToMainListener = {
	pair: [string];
	stream: [string, number];
	quit: [];
	restart: [];
	check_updates: [];
	start_update: [];
	shutdown: [];
	reboot: [];
	delete_machine: [IMachine];
};
export default RendererToMainListener;
