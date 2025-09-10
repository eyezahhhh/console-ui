import { promisify } from "util";
import {
	PathLike,
	readdir as readDirCall,
	readFile as readFileCall,
	watchFile as watchFileCall,
} from "fs";
import { createCompletablePromise } from "@util/promise.util";

export const readFile = promisify(readFileCall);
export const readDir = promisify(readDirCall);
export const watchFile = promisify(watchFileCall);

export function pollWatchFile(
	path: PathLike,
	callback: (data: Buffer) => void,
	interval = 1000,
) {
	const controller = new AbortController();

	const promise = new Promise<void>(async (resolve, reject) => {
		let cache: Buffer | null = null;

		controller.signal.addEventListener("abort", () => resolve()); // close promise on complete

		const check = async () => {
			if (controller.signal.aborted) {
				return;
			}
			try {
				const data = await readFile(path);
				if (!cache || !data.equals(cache)) {
					cache = data;
					callback(data);
				}

				if (!controller.signal.aborted) {
					setTimeout(check, interval);
				}
			} catch (e) {
				reject(e);
			}
		};
		check();
	});
	createCompletablePromise(promise, () => controller.abort());
	return promise;
}
