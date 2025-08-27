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
