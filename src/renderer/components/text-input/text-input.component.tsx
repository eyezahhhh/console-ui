import useNavigatable from "@hook/navigatable.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./text-input.module.scss";
import { cc } from "@util/string.util";
import MovementAction from "@enum/movement-action.enum";
import { useEffect, useMemo, useState } from "react";
import OnScreenKeyboard from "@component/on-screen-keyboard";
import useFocusStore from "@state/focus.store";
import OnScreenKeyboardKeymap from "@type/on-screen-keyboard-keymap.type";

interface Props extends IFocusableProps {
	value: string | number;
	onChange?: (value: string) => void;
	keymap?: OnScreenKeyboardKeymap;
}

export function TextInput({
	setUnfocused,
	index,
	parentKey,
	value,
	onChange,
	keymap,
}: Props) {
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const { isFocusedChildOf, setFocused } = useFocusStore();
	const [selection, setSelection] = useState<[number, number]>([0, 0]);
	const move = (action: MovementAction) => {
		if (keyboardVisible) {
			if (isFocusedChildOf(key)) {
				focusedComponent?.move(action);
			}
			return;
		}

		if (element) {
			if (action == MovementAction.LEFT) {
				let position = element.selectionStart || 0;
				position = Math.max(0, position - 1);
				element.setSelectionRange(position, position);
				return;
			}
			if (action == MovementAction.RIGHT) {
				let position = element.selectionEnd || 0;
				position = Math.min(element.value.length, position + 1);
				element.setSelectionRange(position, position);
				return;
			}
			if (action == MovementAction.ENTER) {
				if (focusedComponent?.key == key) {
					setKeyboardVisible(true);
				} else {
					setFocused(key, action);
				}
				return;
			}
		}

		setUnfocused(action);
	};
	const { ref, focusedComponent, element, key } =
		useNavigatable<HTMLInputElement>(parentKey, index, move);
	const isIndirectlyFocused = useMemo(
		() => isFocusedChildOf(key),
		[focusedComponent, key],
	);

	useEffect(() => {
		if (keyboardVisible && !isIndirectlyFocused) {
			setKeyboardVisible(false);
		}
	}, [isIndirectlyFocused, keyboardVisible]);

	useEffect(() => {
		if (!element) {
			return;
		}
	}, [element]);

	return (
		<span>
			<input
				ref={ref}
				value={value}
				onInput={(e) => onChange?.(e.currentTarget.value)}
				className={cc(styles.input, isIndirectlyFocused && styles.focused)}
				onClick={() => move(MovementAction.ENTER)}
				onSelect={(e) =>
					setSelection([
						e.currentTarget.selectionStart ?? 0,
						e.currentTarget.selectionEnd ?? e.currentTarget.selectionStart ?? 0,
					])
				}
			/>
			{keyboardVisible && (
				<OnScreenKeyboard
					parentKey={key}
					index={0}
					selection={selection}
					value={`${value}`}
					keymap={keymap}
					setUnfocused={(action) => {
						if (action == MovementAction.BACK || action == MovementAction.UP) {
							setKeyboardVisible(false);
							setFocused(key, MovementAction.BACK);
							return;
						}
						if (action == MovementAction.ENTER) {
							console.log("Keyboard key was pressed, returning focus to input");
							element?.focus();
						}
					}}
					onChange={onChange}
				/>
			)}
		</span>
	);
}
