type Row1 =
	| "`"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "0"
	| "-"
	| "=";
type Row1Cap =
	| "~"
	| "!"
	| "@"
	| "#"
	| "$"
	| "%"
	| "^"
	| "&"
	| "*"
	| "("
	| ")"
	| "_"
	| "+";

type Row2 =
	| "q"
	| "w"
	| "e"
	| "r"
	| "t"
	| "y"
	| "u"
	| "i"
	| "o"
	| "p"
	| "["
	| "]"
	| "\\";
type Row2Cap =
	| "Q"
	| "W"
	| "E"
	| "R"
	| "T"
	| "Y"
	| "U"
	| "I"
	| "O"
	| "P"
	| "{"
	| "}"
	| "|";

type Row3 = "a" | "s" | "d" | "f" | "g" | "h" | "j" | "k" | "l" | ";" | "'";
type Row3Cap = "A" | "S" | "D" | "F" | "G" | "H" | "J" | "K" | "L" | ":" | '"';

type Row4 = "z" | "x" | "c" | "v" | "b" | "n" | "m" | "," | "." | "/";
type Row4Cap = "Z" | "X" | "C" | "V" | "B" | "N" | "M" | "<" | ">" | "?";

type Special =
	| "tab"
	| "capslock"
	| "shift"
	| "shift_"
	| "backspace"
	| "enter"
	| "space"
	| "exit";

type OnScreenKeyboardKey =
	| Row1
	| Row1Cap
	| Row2
	| Row2Cap
	| Row3
	| Row3Cap
	| Row4
	| Row4Cap
	| Special;
export default OnScreenKeyboardKey;
