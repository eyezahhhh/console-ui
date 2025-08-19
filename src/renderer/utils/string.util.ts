export function cc(...classNames: (string | false | undefined | null)[]) {
	return classNames.filter(Boolean).join(" ");
}
