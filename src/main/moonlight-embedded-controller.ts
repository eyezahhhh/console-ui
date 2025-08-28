import commandExists from "command-exists";
import { Logger, StandaloneLogger } from "./logger";
import Bonjour from "bonjour";
import MoonlightHost from "./moonlight-host";
import { readFile } from "fs";
import path from "path";
import { promisify } from "util";
import os from "os";
import crypto from "crypto";
import Https from "https";
import IMoonlightHostStatus from "@interface/moonlight-host-status.interface";
import { IpcMain } from "./ipc";
import ISunshineApp from "@interface/sunshine-app.interface";
import { ChildProcessWithoutNullStreams, spawn, exec } from "child_process";

export class MoonlightEmbeddedController extends Logger {
	private _isEnabled = false;
	private readonly hosts = new Set<MoonlightHost>();
	private stream: ChildProcessWithoutNullStreams | null = null;

	constructor(
		private readonly command: string,
		private readonly ipc: IpcMain,
	) {
		super();
		this.log("Starting...");

		this.debug(`Using Moonlight Embedded command "${command}".`);

		commandExists(command)
			.then(() => this.generateKeys())
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

						const host = new MoonlightHost(
							service.addresses[0],
							service.port,
							this,
							this.ipc,
						);
						host.addEventListener("status", () => {
							this.hostsUpdated();
						});
						this.hosts.add(host);
						this.hostsUpdated();
					},
				);
			})
			.catch((e) => {
				this.error(e);
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

	getHosts() {
		return Array.from(this.hosts);
	}

	getMachines() {
		return this.getHosts()
			.map((host) => host.asMachine())
			.filter((machine) => !!machine);
	}

	private async generateKeys() {
		try {
			await promisify(exec)(`${this.command} pair 0`);
		} catch {}
	}

	private hostsUpdated() {
		this.ipc.send("machines", this.getMachines());
	}

	private async findDirectory() {
		return path.join(os.homedir(), ".cache", "moonlight");
	}

	async getUniqueId() {
		return promisify(readFile)(
			path.join(await this.findDirectory(), "uniqueid.dat"),
			"utf-8",
		);
	}

	async getPublicKey() {
		const contents = await promisify(readFile)(
			path.join(await this.findDirectory(), "client.pem"),
		);
		return contents;
	}

	private async getPrivateKey() {
		return promisify(readFile)(
			path.join(await this.findDirectory(), "key.pem"),
			"utf-8",
		);
	}

	async sign(blob: crypto.BinaryLike, algorithm: string) {
		const key = await this.getPrivateKey();
		const sign = crypto.createSign(algorithm);
		sign.update(blob);
		sign.end();
		return sign.sign(key);
	}

	async createHttpsAgent(
		options?: Omit<Omit<Https.AgentOptions, "key">, "cert">,
	) {
		return new Https.Agent({
			...options,
			key: await this.getPrivateKey(),
			cert: await this.getPublicKey(),
		});
	}

	isStreaming() {
		return !!this.stream;
	}

	startStream(host: MoonlightHost, app: ISunshineApp) {
		if (this.stream) {
			throw new Error("Stream is already active");
		}
		return new Promise<void>((resolve) => {
			const machine = host.asMachine();
			const logger = new StandaloneLogger(
				`Stream ${host.getAddress().address} - ${app.AppTitle}`,
			);
			logger.log("Starting child process.");

			const child = spawn(
				this.command,
				["stream", host.getAddress().address, "-app", app.AppTitle],
				{
					stdio: [null, null, null],
				},
			);
			this.stream = child;

			child.on("spawn", () => {
				logger.log("Spawned.");
				const window = this.ipc.getWindow();
				if (window) {
					window.close();
				}
			});

			child.on("exit", (code) => {
				logger.log(`Exited with code ${code}.`);
				if (this.stream == child) {
					this.stream = null;
				}
				const url = machine ? `/machine/${machine.uuid}` : "/";
				this.ipc.getOrCreateWindow(url).show();
				resolve();
			});

			child.stdout.on("data", (message: Buffer) => {
				logger.log("<LOG>", message.toString());
			});

			child.stderr.on("data", (message: Buffer) => {
				logger.log("<LOG ERROR>", message.toString());
			});
		});
	}
}
