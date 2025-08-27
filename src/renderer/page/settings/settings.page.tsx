import { Dropdown } from "@component/dropdown/dropdown.component";
import NavList from "@component/nav-list";
import ResolutionInput from "@component/resolution-input";
import TextInput from "@component/text-input";
import { Toggle } from "@component/toggle/toggle.component";
import IFocusableProps from "@interface/focusable-props.interface";
import { useState } from "react";

export function SettingsPage(props: IFocusableProps) {
	const [dropdownValue, setDropdownValue] = useState(0);
	const [inputValue, setInputValue] = useState("Hello");
	const [resolution, setResolution] = useState<[number, number]>([1920, 1080]);

	return (
		<NavList {...props} direction="vertical">
			{(props) => (
				<Dropdown
					{...props}
					options={["Auto", "H.264", "H.265", "AV1"]}
					selectedIndex={dropdownValue}
					onSelect={(index) => {
						console.log("Settings page got index", index);
						setDropdownValue(index);
					}}
				/>
			)}
			{(props) => <Toggle {...props} enabled />}
			{(props) => (
				<TextInput {...props} value={inputValue} onChange={setInputValue} />
			)}
			{(props) => (
				<ResolutionInput
					{...props}
					resolution={resolution}
					onChange={setResolution}
				/>
			)}
		</NavList>
	);
}
