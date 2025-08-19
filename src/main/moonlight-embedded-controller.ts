import commandExists from "command-exists";
import { Logger } from "./logger";

export class MoonlightEmbeddedController extends Logger {
	private isEnabled = false;

	constructor(private readonly command: string) {
		super();
		this.log("Starting...");

		this.debug(`Using Moonlight Embedded command "${command}".`);

		commandExists(command)
			.then(() => {
				this.isEnabled = true;
				this.debug(
					"Moonlight Embedded command exists, Moonlight functionality is enabled.",
				);
			})
			.catch(() => {
				this.warn(
					`Moonlight Embedded command "${command}" wasn't found. Moonlight functionality is disabled.`,
				);
			});
	}
}
