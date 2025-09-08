export function abbreviateMeasurement(number: number, decimals = 0) {
	const PREFIXES = ["K", "M", "G", "T"];
	const decimalScale = Math.pow(10, decimals);

	for (let i = PREFIXES.length - 1; i >= 0; i--) {
		const scale = Math.pow(1000, i + 1);
		if (number >= scale) {
			return `${Math.floor((number / scale) * decimalScale) / decimalScale}${PREFIXES[i]}`;
		}
	}

	return `${Math.floor(number * decimalScale) / decimalScale}`;
}
