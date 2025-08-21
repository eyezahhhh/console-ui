import commandExists from "command-exists";
import { Logger } from "./logger";
import Bonjour from "bonjour";
import MoonlightHost from "./moonlight-host";
import IMoonlightHostStatus from "../shared/interface/moonlight-host-status.interface";

export class MoonlightEmbeddedController extends Logger {
	private _isEnabled = false;
	private readonly hosts = new Set<MoonlightHost>();

	constructor(private readonly command: string) {
		super();
		this.log("Starting...");

		this.debug(`Using Moonlight Embedded command "${command}".`);

		commandExists(command)
			.then(() => {
				this._isEnabled = true;
				this.debug(
					"Moonlight Embedded command exists, Moonlight functionality is enabled.",
				);

				const discovery = Bonjour().find(
					{
						type: "nvstream",
					},
					(service) => {
						this.log(
							"Discovered NVIDIA Gamestream/Sunshine instance:",
							service,
						);

						const existingHost = this.findHost(
							(status) =>
								status.address == service.addresses[0] &&
								status.port == service.port,
						);

						if (existingHost) {
							this.log(`Host was detected and instantiated.`);
							return;
						}

						const host = new MoonlightHost(service.addresses[0], service.port);
						host.addListener((status) => {
							const { address } = host.getAddress();
							this.log(`Host ${address} updated its status:`, status);
							this.hostsUpdated();
						});
						this.hosts.add(host);
						this.hostsUpdated();
					},
				);
			})
			.catch(() => {
				this.warn(
					`Moonlight Embedded command "${command}" wasn't found. Moonlight functionality is disabled.`,
				);
			});
	}

	isEnabled() {
		return this._isEnabled;
	}

	findHost(predicate: (status: IMoonlightHostStatus) => boolean) {
		for (let host of this.hosts) {
			if (predicate(host.getStatus())) {
				return host;
			}
		}
		return null;
	}

	private hostsUpdated() {
		this.log("Hosts have updated!");
	}
}
