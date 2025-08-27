import { useEffect, useMemo } from "react";
import useMachines from "./machines.hook";
import IMachine from "@interface/machine.interface";

interface Options {
	onPin: (pin: string) => void;
}

export default function useMachine(
	uuid: string | null,
	{ onPin }: Partial<Options> = {},
) {
	const machines = useMachines();
	const machine = useMemo(() => {
		return machines.find((machine) => machine.uuid == uuid) || null;
	}, [machines, uuid]);

	useEffect(() => {
		if (!machine) {
			return;
		}

		const pinListener = (pin: string, pinMachine: IMachine) => {
			if (pinMachine.uuid == machine.uuid) {
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
