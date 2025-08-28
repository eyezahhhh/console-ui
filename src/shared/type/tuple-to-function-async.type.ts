type TupleToFunctionAsync<T extends [any[], any]> = T extends [
	infer Args extends any[],
	infer R,
]
	? (...args: Args) => R | Promise<R>
	: never;

export default TupleToFunctionAsync;
