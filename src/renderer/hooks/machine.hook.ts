import { useEffect, useMemo } from "react";
import useMachines from "./machines.hook";
import IDiscoveredMachine from "@interface/discovered-machine.interface";
import { isMachineDiscovered } from "@util/object.util";

interface Options {
	onPin: (pin: string) => void;
}

export default function useMachine(
	uuid: string | null,
	{ onPin }: Partial<Options> = {},
) {
	const machines = useMachines();
	const machine = useMemo(() => {
		return (
			machines.find(
				(machine) => machine.config.discovered && machine.config.uuid == uuid,
			) || null
		);
	}, [machines, uuid]);

	useEffect(() => {
		if (!isMachineDiscovered(machine)) {
			return;
		}

		const pinListener = (pin: string, pinMachine: IDiscoveredMachine) => {
			if (pinMachine.config.uuid == machine.config.uuid) {
				onPin?.(pin);
			}
		};

		window.ipc.addEventListener("pairing_code", pinListener);
		console.log("Registering pairing code listener");

		return () => {
			window.ipc.removeEventListener("pairing_code", pinListener);
		};
	}, [machine, onPin]);

	return machine;
}
