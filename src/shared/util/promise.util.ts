import CompletablePromise from "@type/completable-promise.type";

export function createCompletablePromise<T>(
	promise: Promise<T>,
	completeCallback: () => void,
): asserts promise is CompletablePromise<T> {
	const completable = promise as CompletablePromise<T>;
	completable.complete = completeCallback;
}
