import { useEffect, useMemo, useState } from "react";
import { StandaloneEmitter } from "@util/emitter.util";
import IPowerSupply from "@interface/power-supply.interface";
import PowerSupplyType from "@enum/power-supply-type.enum";

const emitter = new StandaloneEmitter<{ info: [IPowerSupply[]] }>();
let info: IPowerSupply[] = [];

const updatePowerSupplies = (powerSupplies: IPowerSupply[]) => {
	info = powerSupplies;
	emitter.emit("info", powerSupplies);
};

window.ipc.invoke("get_power_supplies").then(updatePowerSupplies);
window.ipc.addEventListener("power_supplies", updatePowerSupplies);

type ExtractPowerSupply<T extends PowerSupplyType> = Extract<
	IPowerSupply,
	{ type: T }
>;

export default function usePowerSupplies<T extends PowerSupplyType>(
	type: T[] = [],
): T extends never ? IPowerSupply[] : ExtractPowerSupply<T>[] {
	const [cache, setCache] = useState(info);
	const filteredCache = useMemo(() => {
		if (!type.length) {
			return [...cache];
		}
		return cache.filter((psu) => type.includes(psu.type as T));
	}, [cache, type.join()]);

	useEffect(() => {
		emitter.addEventListener("info", setCache);

		return () => {
			emitter.removeEventListener("info", setCache);
		};
	}, []);

	return filteredCache as any;
}
