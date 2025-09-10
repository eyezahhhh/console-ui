import { StandaloneLogger } from "@/logger";
import { pollWatchFile, readFile } from "@/util/file.util";
import BatteryState from "@enum/battery-state.enum";
import PowerSupplyType from "@enum/power-supply-type.enum";
import IPowerSupply from "@interface/power-supply.interface";
import { Emitter } from "@util/emitter.util";
import { enumValues } from "@util/object.util";
import path from "path";

type Events = {
	type: [PowerSupplyType | null];
	status: [IPowerSupply | null];
};

export class PowerSupply extends Emitter<Events> {
	private readonly logger = new StandaloneLogger(`PowerSupply ${this.id}`);
	private type: PowerSupplyType | null = null;
	private status: IPowerSupply | null = null;
	private isDestroyed = false;
	private listenCleanup: (() => void) | null = null;

	constructor(private readonly id: string) {
		super();

		this.addEventListener("type", (type) => {
			this.logger.log(`Type updated: "${type}"`);
			this.type = type;
			this.listen();
		});

		this.updateType().catch((e) => this.logger.error(e));
	}

	getType() {
		return this.type;
	}

	private getPath(...additionalPath: string[]) {
		return path.join("/sys/class/power_supply", this.id, ...additionalPath);
	}

	private async updateType() {
		if (this.isDestroyed) {
			if (this.type !== null) {
				this.emit("type", null);
			}
			return;
		}
		const supportedTypes = enumValues(PowerSupplyType);

		const contents = (await readFile(this.getPath("type"), "utf-8"))
			.trim()
			.toLowerCase();

		const type = supportedTypes.includes(contents as PowerSupplyType)
			? (contents as PowerSupplyType)
			: null;
		if (this.type != type) {
			this.emit("type", type);
		}
	}

	private update(status: IPowerSupply | null) {
		const oldSerialized = JSON.stringify(this.status);
		const newSerialized = JSON.stringify(status);

		if (oldSerialized != newSerialized) {
			this.status = structuredClone(status);
			this.emit("status", this.status);
		}
	}

	getStatus() {
		return this.status;
	}

	destroy() {
		this.isDestroyed = true;
		this.updateType().then(() => {
			this.removeAllListeners();
		});
	}

	private listen() {
		this.listenCleanup?.();
		this.listenCleanup = null;
		const type = this.getType();
		if (this.type === null) {
			this.update(null);
			return;
		}

		const cleanups = new Set<() => void>();

		if (type == PowerSupplyType.BATTERY) {
			const status: Partial<IPowerSupply> = {
				id: this.id,
				type: PowerSupplyType.BATTERY,
			};

			const update = () => {
				if ("percent" in status && "state" in status) {
					this.update(status as IPowerSupply);
				}
			};

			const capacityPromise = pollWatchFile(
				this.getPath("capacity"),
				(buffer) => {
					const percent = parseInt(buffer.toString("utf-8").trim());
					if (!isNaN(percent) && percent >= 0) {
						status.percent = percent;
						update();
					}
				},
			);
			cleanups.add(capacityPromise.complete);

			const statusPromise = pollWatchFile(this.getPath("status"), (buffer) => {
				const data = buffer.toString("utf-8").trim();
				const state = {
					Charging: BatteryState.CHARGING,
					Full: BatteryState.CHARGED,
					Discharging: BatteryState.DISCHARGING,
					Unknown: BatteryState.UNKNOWN,
				}[data];
				if (state) {
					status.state = state;
					update();
				}
			});
			cleanups.add(statusPromise.complete);
		}

		this.listenCleanup = () => {
			for (let callback of cleanups) {
				callback();
			}
		};
	}
}
