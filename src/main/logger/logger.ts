import { LoggerStackTrace } from "./logger-stack-trace";

type Constructor = { new (...args: any[]): any };

export class Logger {
	private readonly prefix: string;

	constructor(subject?: string | Constructor | Object) {
		const prefix = Logger.derivePrefix(subject);
		this.prefix = prefix || this.constructor.name;
	}

	static derivePrefix(subject?: string | Constructor | Object) {
		if (typeof subject == "string") {
			return subject;
		} else if (typeof subject == "function") {
			return subject.name;
		} else if (typeof subject == "object") {
			return subject.constructor.name;
		}
		return null;
	}

	private getPrefix() {
		return `[${this.prefix}]`;
	}

	private getStackTrace(): LoggerStackTrace[] {
		try {
			throw new Error();
		} catch (e) {
			const error = e as Error;
			if (!error.stack) {
				return [];
			}

			const lines = error.stack.split("\n").slice(3);

			return lines.map((l) => {
				const index = l.indexOf("at ");
				const clean = l.slice(index + 3, l.length - 1);

				return new LoggerStackTrace({
					object: "",
					path: "",
					line: 0,
					column: 0,
				});

				// const [object, source] = clean.split(" (", 2);
				// const parts = source.split(":");
				// const column = parseInt(parts.pop()!);
				// const line = parseInt(parts.pop()!);
				// const path = parts.join(":");

				// return new LoggerStackTrace({
				// 	object,
				// 	path,
				// 	line,
				// 	column,
				// });
			});
		}
	}

	protected log(...params: any[]) {
		console.log(this.getPrefix(), ...params);
	}

	protected warn(...params: any[]) {
		console.warn(this.getPrefix(), ...params);
	}

	protected debug(...params: any[]) {
		console.debug(this.getPrefix(), ...params);
	}

	protected error(...params: any[]) {
		const stackTrace = this.getStackTrace();
		console.error(
			this.getPrefix(),
			...params,
			...stackTrace.map((line) => `\n\t${line}`),
		);
	}
}

export class StandaloneLogger extends Logger {
	constructor(subject: string | Constructor | Object) {
		super(subject);
	}

	public log = super.log;
	public warn = super.warn;
	public debug = super.debug;
	public error = super.error;
}
