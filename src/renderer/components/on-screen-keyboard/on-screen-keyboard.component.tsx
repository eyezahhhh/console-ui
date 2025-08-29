import NavList from "@component/nav-list";
import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./on-screen-keyboard.module.scss";
import useFocusStore from "@state/focus.store";
import { useCallback, useEffect, useMemo, useState } from "react";
import useNavigatable from "@hook/navigatable.hook";
import { cc } from "@util/string.util";
import MovementAction from "@enum/movement-action.enum";

interface KeyProps extends IFocusableProps {
	letter: string;
	focusOnCreate?: boolean;
	onFocus?: (move: (action: MovementAction) => void) => void;
	u?: number;
	onPress?: (letter: string) => void;
}

function Key({
	parentKey,
	index,
	setUnfocused,
	letter,
	focusOnCreate,
	u,
	onPress,
}: KeyProps) {
	const formattedLetter = useMemo(() => {
		return letter.split("_").join("");
	}, [letter]);
	const move = useCallback(
		(action: MovementAction) => {
			if (action == MovementAction.ENTER) {
				setFocused(key, action);
				onPress?.(letter);
			}
			setUnfocused(action);
		},
		[setUnfocused, onPress],
	);

	const { ref, isFocused, key, isRegistered } = useNavigatable(
		parentKey,
		index,
		move,
		undefined,
		true,
	);
	const { setFocused } = useFocusStore();

	useEffect(() => {
		if (focusOnCreate && key && isRegistered) {
			setFocused(key, MovementAction.ENTER);
		}
	}, [focusOnCreate, key, isRegistered]);

	return (
		<div
			className={cc(styles.key, isFocused && styles.focused)}
			ref={ref}
			onClick={() => move(MovementAction.ENTER)}
			style={{
				width: `${(u || 1) * 60}px`,
			}}
		>
			{formattedLetter}
		</div>
	);
}

interface Props extends IFocusableProps {}

export function OnScreenKeyboard({ parentKey, setUnfocused, index }: Props) {
	const [capslock, setCapslock] = useState(false);
	const [shift, setShift] = useState(false);

	const press = (key: string) => {
		console.log("PRESS:", key);
	};

	const keymap = STANDARD_KEYMAP;

	return (
		<NavList
			parentKey={parentKey}
			index={index}
			direction="vertical"
			className={styles.container}
			setUnfocused={setUnfocused}
		>
			{keymap.map((row) => (props) => (
				<NavList {...props} direction="horizontal" className={styles.row}>
					{row.map(([letter, width]) => (props) => (
						<Key
							{...props}
							letter={letter}
							key={letter}
							onPress={press}
							u={width}
						/>
					))}
				</NavList>
			))}
		</NavList>
	);
}

const STANDARD_KEYMAP: [string, number][][] = [
	[
		["`", 1],
		["1", 1],
		["2", 1],
		["3", 1],
		["4", 1],
		["5", 1],
		["6", 1],
		["7", 1],
		["8", 1],
		["9", 1],
		["0", 1],
		["-", 1],
		["=", 1],
		["back", 2],
	],
	[
		["tab", 1.5],
		["q", 1],
		["w", 1],
		["e", 1],
		["r", 1],
		["t", 1],
		["y", 1],
		["u", 1],
		["i", 1],
		["o", 1],
		["p", 1],
		["[", 1],
		["]", 1],
		["\\", 1.5],
	],
	[
		["capslock", 1.75],
		["a", 1],
		["s", 1],
		["d", 1],
		["f", 1],
		["g", 1],
		["h", 1],
		["j", 1],
		["k", 1],
		["l", 1],
		[";", 1],
		["'", 1],
		["enter", 2.25],
	],
	[
		["shift", 2.25],
		["z", 1],
		["x", 1],
		["c", 1],
		["v", 1],
		["b", 1],
		["n", 1],
		["m", 1],
		[",", 1],
		[".", 1],
		["/", 1],
		["shift_", 2.75],
	],
];
