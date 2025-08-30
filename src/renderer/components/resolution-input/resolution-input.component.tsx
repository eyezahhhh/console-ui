import NavList from "@component/nav-list";
import TextInput from "@component/text-input";
import IFocusableProps from "@interface/focusable-props.interface";

interface Props extends IFocusableProps {
	resolution: [number, number];
	onChange?: (resolution: [number, number]) => void;
}

export function ResolutionInput({
	parentKey,
	index,
	setUnfocused,
	resolution,
	onChange,
}: Props) {
	const change = (value: string, index: 0 | 1) => {
		if (!value.length) {
			value = "0";
		}
		const int = parseInt(value);
		if (isNaN(int)) {
			return;
		}

		if (int <= 0 || int > 1_000_000) {
			return;
		}

		const newRes = [...resolution] as [number, number];
		newRes[index] = int;
		onChange?.(newRes);
	};

	return (
		<NavList
			direction="horizontal"
			parentKey={parentKey}
			index={index}
			setUnfocused={setUnfocused}
		>
			{(props) => (
				<TextInput
					{...props}
					value={resolution[0]}
					onChange={(e) => change(e, 0)}
					keymap="whole_number"
				/>
			)}
			{(props) => (
				<TextInput
					{...props}
					value={resolution[1]}
					onChange={(e) => change(e, 1)}
					keymap="whole_number"
				/>
			)}
		</NavList>
	);
}
