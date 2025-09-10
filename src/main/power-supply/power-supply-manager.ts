import { Emitter } from "@util/emitter.util";
import { IpcMain } from "../ipc";
import { StandaloneLogger } from "../logger";
import { readDir } from "../util/file.util";
import IPowerSupply from "@interface/power-supply.interface";
import { PowerSupply } from "./power-supply";

type Events = {
	status: [IPowerSupply[]];
};

export default class PowerSupplyManager extends Emitter<Events> {
	private readonly logger = new StandaloneLogger(this);
	private readonly powerSupplies = new Map<string, PowerSupply>();

	constructor(ipc: IpcMain) {
		super();

		this.addEventListener("status", (powerSupplies) => {
			ipc.send("power_supplies", powerSupplies);
		});

		this.scan().catch((e) => this.logger.error(e));

		setInterval(() => {
			this.scan().catch((e) => this.logger.error(e));
		}, 30_000);
	}

	async scan() {
		const ids = await readDir("/sys/class/power_supply");
		for (let [id, psu] of this.powerSupplies) {
			if (!ids.includes(id)) {
				this.logger.log(`PSU removed: "${id}"`);
				psu.destroy();
				this.powerSupplies.delete(id);
			}
		}

		for (let id of ids) {
			if (!this.powerSupplies.has(id)) {
				this.logger.log(`PSU added: "${id}"`);
				const psu = new PowerSupply(id);
				this.powerSupplies.set(id, psu);
				psu.addEventListener("status", () => {
					this.emit("status", this.getPowerSupplies());
				});
			}
		}
	}

	getPowerSupplies() {
		return Array.from(this.powerSupplies.values())
			.map((psu) => psu.getStatus())
			.filter((status) => !!status);
	}
}
