import ILoggerStackTrace from "@interface/logger-stack-trace.interface";

export class LoggerStackTrace {
	public readonly object: string;
	public readonly path: string;
	public readonly line: number;
	public readonly column: number;

	constructor(stackTrace: ILoggerStackTrace) {
		this.object = stackTrace.object;
		this.path = stackTrace.path;
		this.line = stackTrace.line;
		this.column = stackTrace.column;
	}

	toString() {
		return `${this.object} (${this.path}:${this.line}:${this.column})`;
	}

	toJSON(): ILoggerStackTrace {
		return {
			object: this.object,
			path: this.path,
			line: this.line,
			column: this.column,
		};
	}
}
