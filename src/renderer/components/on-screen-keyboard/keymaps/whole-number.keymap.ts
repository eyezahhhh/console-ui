import OnScreenKeyboardKeymapLayout from "@type/on-screen-keyboard-keymap-layout.type";

const WHOLE_NUMBER_KEYMAP: OnScreenKeyboardKeymapLayout = [
	[
		["1", null, 1],
		["2", null, 1],
		["3", null, 1],
		["backspace", null, 2],
	],
	[
		["4", null, 1],
		["5", null, 1],
		["6", null, 1],
		["exit", null, 2],
	],
	[
		["7", null, 1],
		["8", null, 1],
		["9", null, 1],
		[null, null, 2],
	],
	[
		[null, null, 1],
		["0", null, 1],
		["left", null, 1.5],
		["right", null, 1.5],
	],
];
export default WHOLE_NUMBER_KEYMAP;
