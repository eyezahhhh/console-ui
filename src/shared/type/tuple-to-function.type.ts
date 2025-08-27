type TupleToFunction<T extends [any[], any]> = T extends [
	infer Args extends any[],
	infer R,
]
	? (...args: Args) => R
	: never;

export default TupleToFunction;
