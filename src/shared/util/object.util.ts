import IDiscoveredMachine from "@interface/discovered-machine.interface";
import IMachine from "@interface/machine.interface";

export function assertMachineDiscovered(
	machine: IMachine,
): asserts machine is IDiscoveredMachine {
	if (!machine.config.discovered) {
		throw new Error("Machine is not discovered");
	}
}

export function isMachineDiscovered(
	machine: IMachine | null,
): machine is IDiscoveredMachine {
	return !!machine?.config.discovered;
}

export function isMachineOnline(
	machine: IMachine | null,
): machine is Extract<IMachine, { online: true }> {
	return !!machine?.online;
}

export function isMachinePaired(
	machine: IMachine | null,
): machine is Extract<IMachine, { online: true; isPaired: true }> {
	return isMachineOnline(machine) && machine.isPaired;
}

export function enumValues<T extends object>(e: T) {
	return Object.values(e).filter(
		(v) => typeof v !== "number" || !Object.keys(e).includes(v as any),
	) as Array<T[keyof T]>;
}
