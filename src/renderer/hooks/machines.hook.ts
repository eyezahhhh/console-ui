import { useEffect, useState } from "react";
import { StandaloneEmitter } from "@util/emitter.util";
import IMachine from "@interface/machine.interface";

const emitter = new StandaloneEmitter<{ machines: [IMachine[]] }>();
let machines: IMachine[] = [];
const updateMachines = (newMachines: IMachine[]) => {
	console.log("Received machines:", newMachines);
	machines = newMachines;
	emitter.emit("machines", machines);
};

window.ipc.invoke("get_machines").then(updateMachines);
window.ipc.addEventListener("machines", updateMachines);

export default function useMachines() {
	const [cache, setCache] = useState([...machines]);

	useEffect(() => {
		emitter.addEventListener("machines", setCache);

		return () => {
			emitter.removeEventListener("machines", setCache);
		};
	}, []);

	return cache;
}
