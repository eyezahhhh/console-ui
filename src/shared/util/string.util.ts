export function cc(...classNames: (string | false | undefined | null)[]) {
	return classNames.filter(Boolean).join(" ");
}

export function getGamestreamHostName(type: "gamestream" | "sunshine" | null) {
	switch (type) {
		case "gamestream":
			return "NVIDIA Gamestream";
		case "sunshine":
			return "Sunshine";
		default:
			return "Sunshine or NVIDIA Gamestream";
	}
}

export function splice(
	value: string,
	start: number,
	length: number,
	insert?: string,
) {
	const chars = value.split("");
	if (insert) {
		chars.splice(start, length, insert);
	} else {
		chars.splice(start, length);
	}
	return chars.join("");
}
