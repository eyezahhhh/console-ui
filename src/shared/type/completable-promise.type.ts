export default interface CompletablePromise<T> extends Promise<T> {
	complete(): void;
}
