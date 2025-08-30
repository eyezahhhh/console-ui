import NavList from "@component/nav-list";
import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./on-screen-keyboard.module.scss";
import useFocusStore from "@state/focus.store";
import { useCallback, useEffect, useMemo, useState } from "react";
import useNavigatable from "@hook/navigatable.hook";
import { cc, splice } from "@util/string.util";
import MovementAction from "@enum/movement-action.enum";
import OnScreenKeyboardKey from "@type/on-screen-keyboard-key.type";
import OnScreenKeyboardKeymap from "@type/on-screen-keyboard-keymap.type";
import OnScreenKeyboardKeymapLayout from "@type/on-screen-keyboard-keymap-layout.type";
import STANDARD_KEYMAP from "./keymaps/standard.keymap";
import IP_ADDRESS_KEYMAP from "./keymaps/ip-address.keymap";
import WHOLE_NUMBER_KEYMAP from "./keymaps/whole-number.keymap";

interface KeyProps extends IFocusableProps {
	letter: OnScreenKeyboardKey;
	capitalLetter: OnScreenKeyboardKey;
	focusOnCreate?: boolean;
	onFocus?: (move: (action: MovementAction) => void) => void;
	u: number;
	onPress?: (letter: OnScreenKeyboardKey) => void;
	capital: boolean;
	held?: boolean;
	noAnimation?: boolean;
}

const keymaps: Record<OnScreenKeyboardKeymap, OnScreenKeyboardKeymapLayout> = {
	standard: STANDARD_KEYMAP,
	ip_address: IP_ADDRESS_KEYMAP,
	whole_number: WHOLE_NUMBER_KEYMAP,
};

function Key({
	parentKey,
	index,
	setUnfocused,
	letter,
	capitalLetter,
	focusOnCreate,
	u,
	onPress,
	capital,
	held,
	noAnimation,
}: KeyProps) {
	const [bounceStart, setBounceStart] = useState(-1);
	const formattedLetter = useMemo(() => {
		const usingLetter = capital ? capitalLetter : letter;
		switch (usingLetter) {
			case "space":
				return "";
			case "tab":
				return "⇥";
			case "shift":
			case "shift_":
				return "⇧";
			case "backspace":
				return "⌫";
			case "enter":
				return "↵";
			case "capslock":
				return "⇪";
			default:
				return usingLetter.split("_").join(""); // underscores allow for duplicates
		}
	}, [letter, capitalLetter, capital]);
	const move = useCallback(
		(action: MovementAction) => {
			if (action == MovementAction.ENTER) {
				setFocused(key, action);
				onPress?.(capital ? capitalLetter : letter);
				setBounceStart(Date.now());
			}
			setUnfocused(action);
		},
		[setUnfocused, onPress, capital, capitalLetter, letter],
	);

	const { ref, isFocused, key, isRegistered, element } = useNavigatable(
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

	useEffect(() => {
		if (!element || bounceStart < 0 || noAnimation) {
			return;
		}

		element.classList.remove(styles.bouncing);
		void element.offsetWidth; // trigger reflow
		element.classList.add(styles.bouncing);
	}, [bounceStart, element, noAnimation]);

	return (
		<div
			className={cc(
				styles.key,
				isFocused && styles.focused,
				held && styles.held,
			)}
			ref={ref}
			onClick={() => move(MovementAction.ENTER)}
			style={{
				width: `${u * 60}px`,
			}}
		>
			{formattedLetter}
		</div>
	);
}

interface Props extends IFocusableProps {
	value: string;
	selection: [number, number];
	onChange?: (value: string) => void;
	keymap?: OnScreenKeyboardKeymap;
}

export function OnScreenKeyboard({
	parentKey,
	setUnfocused,
	index,
	value,
	selection,
	onChange,
	keymap,
}: Props) {
	const [capslock, setCapslock] = useState(false);
	const [shift, setShift] = useState(false);
	const keymapLayout = keymaps[keymap || "standard"];

	const press = (key: OnScreenKeyboardKey) => {
		switch (key) {
			case "capslock":
				return setCapslock(!capslock);
			case "shift":
			case "shift_":
				return setShift(!shift);
			case "enter":
				return setUnfocused(MovementAction.ENTER);
			case "backspace":
				if (selection[0] == selection[1]) {
					if (!selection[0]) {
						// backspacing at the start of the input does nothing
						return;
					}
					onChange?.(splice(value, selection[0] - 1, 1)); // no text is selected. delete 1 char
				} else {
					onChange?.(splice(value, selection[0], selection[1] - selection[0])); // text is selected. delete it
				}
				return;
			default: {
				let letter: string = key;
				if (key == "tab") {
					letter = "\t";
				}
				if (key == "space") {
					letter = " ";
				}
				if (selection[0] == selection[1]) {
					onChange?.(splice(value, selection[0], 0, letter));
				} else {
					onChange?.(
						splice(value, selection[0], selection[1] - selection[0], letter),
					);
				}
				setShift(false);
			}
		}
	};

	return (
		<NavList
			parentKey={parentKey}
			index={index}
			direction="vertical"
			className={styles.container}
			setUnfocused={setUnfocused}
		>
			{keymapLayout.map((row, rowIndex) => (props) => (
				<NavList {...props} direction="horizontal" className={styles.row}>
					{row.map(([letter, capitalLetter, width], keyIndex) =>
						letter === null ? (
							<span
								className={styles.spacer}
								key={`spacer ${keyIndex}`}
								style={{
									width: `${width * 60}px`,
								}}
							/>
						) : (
							(props) => (
								<Key
									{...props}
									letter={letter}
									capitalLetter={capitalLetter ?? letter}
									key={letter}
									onPress={press}
									u={width}
									focusOnCreate={!rowIndex && !keyIndex}
									capital={shift != capslock}
									held={
										(letter == "capslock" && capslock) ||
										(["shift", "shift_"].includes(letter) && shift)
									}
									noAnimation={["capslock", "shift", "shift_"].includes(letter)}
								/>
							)
						),
					)}
				</NavList>
			))}
		</NavList>
	);
}
