import useNavigatable from "@hook/navigatable.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./text-input.module.scss";
import { cc } from "@util/string.util";
import MovementAction from "@enum/movement-action.enum";

interface Props extends IFocusableProps {
	value: string | number;
	onChange?: (value: string) => void;
}

export function TextInput({
	setUnfocused,
	index,
	parentKey,
	value,
	onChange,
}: Props) {
	const { ref, isFocused, element } = useNavigatable<HTMLInputElement>(
		parentKey,
		index,
		(action) => {
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
			}

			setUnfocused(action);
		},
	);

	return (
		<input
			ref={ref}
			value={value}
			onInput={(e) => onChange?.(e.currentTarget.value)}
			className={cc(styles.input, isFocused && styles.focused)}
		/>
	);
}
