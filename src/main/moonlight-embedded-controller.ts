import commandExists from "command-exists";
import { Logger, StandaloneLogger } from "./logger";
import Bonjour from "bonjour";
import MoonlightHost from "./moonlight-host";
import { readdir, readFile } from "fs";
import path from "path";
import { promisify } from "util";
import os from "os";
import crypto from "crypto";
import Https from "https";
import IMoonlightHostStatus from "@interface/moonlight-host-status.interface";
import { IpcMain } from "./ipc";
import ISunshineApp from "@interface/sunshine-app.interface";
import { ChildProcessWithoutNullStreams, spawn, exec } from "child_process";
import Settings from "./settings";
import IMachine from "@interface/machine.interface";

export class MoonlightEmbeddedController extends Logger {
	private _isEnabled = false;
	private readonly hosts = new Set<MoonlightHost>();
	private stream: ChildProcessWithoutNullStreams | null = null;
	private readonly command: string;

	constructor(
		private readonly settings: Settings,
		private readonly ipc: IpcMain,
	) {
		super();
		this.log("Starting...");
		this.command = settings.get().moonlightCommand;

		this.debug(`Using Moonlight Embedded command "${this.command}".`);

		commandExists(this.command)
			.then(() => this.generateKeys())
			.then(() => {
				this._isEnabled = true;
				this.debug(
					"Moonlight Embedded command exists, Moonlight functionality is enabled.",
				);

				promisify(readdir)(MoonlightHost.getStorageDir())
					.then(async (files) => {
						for (let file of files) {
							if (!file.endsWith(".json")) {
								continue;
							}
							try {
								await MoonlightHost.fromUuid(
									file.substring(0, file.length - 5),
									this,
								);
							} catch (e) {
								this.error(
									`Failed to create Moonlight host for file "${file}":`,
									e,
								);
							}
						}
					})
					.catch((error) =>
						this.error("Failed to scan for existing Moonlight hosts:", error),
					);

				Bonjour().find(
					{
						type: "nvstream",
					},
					(service) => {
						this.log("Discovered NVIDIA Gamestream/Sunshine instance");

						try {
							this.addHost(service.addresses[0], service.port);
						} catch (e) {
							this.warn(e);
						}
					},
				);
			})
			.catch((e) => {
				this.error(e);
				this.warn(
					`Moonlight Embedded command "${this.command}" wasn't found. Moonlight functionality is disabled.`,
				);
			});
	}

	addHost(address: string, port?: number) {
		const existingHost = this.findHost(
			(info) =>
				info.config.address == address && info.config.port == (port || 47989),
		);
		if (existingHost) {
			throw new Error("Host already registered");
		}
		const host = new MoonlightHost(address, port || null, this, this.ipc);
		this.hosts.add(host);
		host.addEventListener("status", () => {
			this.hostsUpdated();
		});
		this.hostsUpdated();
		return host;
	}

	isEnabled() {
		return this._isEnabled;
	}

	findHost(predicate: (hostInfo: IMachine) => boolean) {
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
			.map((host) => host.getStatus())
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
			const machine = host.getStatus();
			const logger = new StandaloneLogger(
				`Stream ${host.getStatus().config.address} - ${app.AppTitle}`,
			);
			logger.log("Starting child process.");

			const args = [
				"stream",
				host.getStatus().config.address,
				"-app",
				app.AppTitle,
			];
			const settings = this.settings.get();
			args.push("-width", `${settings.resolution[0]}`);
			args.push("-height", `${settings.resolution[1]}`);
			args.push("-rotate", `${settings.rotation}`);
			args.push("-fps", `${settings.fps}`);
			args.push("-bitrate", `${settings.bitrate}`);
			args.push("-packetsize", `${settings.packetSize}`);
			args.push("-codec", settings.codec);
			if (settings.hdr) {
				args.push("-hdr");
			}
			if (typeof settings.remoteOptimizations == "boolean") {
				args.push("-remote", settings.remoteOptimizations ? "yes" : "no");
			} else {
				args.push("-remote", "auto");
			}
			if (settings.surroundSound != "none") {
				args.push("-surround", settings.surroundSound);
			}
			args.push("-platform", settings.platform);
			if (settings.quitAppAfter) {
				args.push("-quitappafter");
			}

			logger.log([this.command, ...args].join(" "));
			const child = spawn(this.command, args, {
				stdio: [null, null, null],
			});
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
				const uuid = machine.config.discovered && machine.config.uuid;
				const url = uuid ? `/machine/${uuid}` : "/";
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
