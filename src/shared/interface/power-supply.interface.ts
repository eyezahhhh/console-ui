import BatteryState from "@enum/battery-state.enum";
import PowerSupplyType from "@enum/power-supply-type.enum";

type IPowerSupply = {
	id: string;
} & (
	| {
			type: PowerSupplyType.MAINS;
	  }
	| {
			type: PowerSupplyType.UPS;
	  }
	| {
			type: PowerSupplyType.USB;
	  }
	| {
			type: PowerSupplyType.WIRELESS;
	  }
	| {
			type: PowerSupplyType.BATTERY;
			state: BatteryState;
			percent: number;
	  }
);
export default IPowerSupply;
