import { Dropdown } from "@component/dropdown/dropdown.component";
import IFocusableProps from "@interface/focusable-props.interface";

interface Props extends IFocusableProps {
	enabled?: boolean;
	onChange?: (enabled: boolean) => void;
}

export function Toggle({
	parentKey,
	index,
	setUnfocused,
	enabled,
	onChange,
}: Props) {
	return (
		<Dropdown
			parentKey={parentKey}
			index={index}
			setUnfocused={setUnfocused}
			options={["Enabled", "Disabled"]}
			selectedIndex={enabled ? 0 : 1}
			onSelect={(index) => onChange?.(!index)}
		/>
	);
}
