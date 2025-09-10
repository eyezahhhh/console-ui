import PowerSupplyType from "@enum/power-supply-type.enum";
import IPowerSupply from "@interface/power-supply.interface";
import BatteryState from "@enum/battery-state.enum";

import PowerIcon from "@mui/icons-material/Power";
import CableIcon from "@mui/icons-material/Cable";
import SettingsInputAntennaIcon from "@mui/icons-material/SettingsInputAntenna";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import BatteryCharging20Icon from "@mui/icons-material/BatteryCharging20";
import BatteryCharging30Icon from "@mui/icons-material/BatteryCharging30";
import BatteryCharging50Icon from "@mui/icons-material/BatteryCharging50";
import BatteryCharging60Icon from "@mui/icons-material/BatteryCharging60";
import BatteryCharging80Icon from "@mui/icons-material/BatteryCharging80";
import BatteryCharging90Icon from "@mui/icons-material/BatteryCharging90";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import BatteryAlertIcon from "@mui/icons-material/BatteryAlert";
import Battery20Icon from "@mui/icons-material/Battery20";
import Battery30Icon from "@mui/icons-material/Battery30";
import Battery50Icon from "@mui/icons-material/Battery50";
import Battery60Icon from "@mui/icons-material/Battery60";
import Battery80Icon from "@mui/icons-material/Battery80";
import Battery90Icon from "@mui/icons-material/Battery90";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material";

type Icon = OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
	muiName: string;
};

export function getPowerSupplyIcon(psu: IPowerSupply): Icon {
	if (psu.type == PowerSupplyType.MAINS) {
		return PowerIcon;
	}

	if (psu.type == PowerSupplyType.UPS) {
		return PowerIcon;
	}

	if (psu.type == PowerSupplyType.USB) {
		return CableIcon;
	}

	if (psu.type == PowerSupplyType.WIRELESS) {
		return SettingsInputAntennaIcon;
	}

	if (psu.type == PowerSupplyType.BATTERY) {
		if (psu.state == BatteryState.CHARGED) {
			return BatteryFullIcon;
		}

		const icons: Record<number, Icon> =
			psu.state == BatteryState.CHARGING
				? {
						20: BatteryCharging20Icon,
						30: BatteryCharging30Icon,
						50: BatteryCharging50Icon,
						60: BatteryCharging60Icon,
						80: BatteryCharging80Icon,
						90: BatteryCharging90Icon,
						100: BatteryChargingFullIcon,
					}
				: {
						10: BatteryAlertIcon,
						20: Battery20Icon,
						30: Battery30Icon,
						50: Battery50Icon,
						60: Battery60Icon,
						80: Battery80Icon,
						90: Battery90Icon,
						100: BatteryChargingFullIcon,
					};

		for (let [key, icon] of Object.entries(icons)) {
			const percent = Number(key);
			if (psu.percent <= percent) {
				return icon;
			}
		}
	}

	return PowerIcon;
}
