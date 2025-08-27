export function toArray<T>(array: T | T[]) {
	if (Array.isArray(array)) {
		return array;
	}
	return [array];
}
