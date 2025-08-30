import OnScreenKeyboardKey from "./on-screen-keyboard-key.type";

type Spacer = [null, null, number];
type Key = [OnScreenKeyboardKey, OnScreenKeyboardKey | null, number];

type Row = (Spacer | Key)[];
type OnScreenKeyboardKeymapLayout = Row[];
export default OnScreenKeyboardKeymapLayout;
