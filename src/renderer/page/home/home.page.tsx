import MachineList from "@component/machine-list";
import NavList from "@component/nav-list";
import IFocusableProps from "@interface/focusable-props.interface";

export function HomePage(props: IFocusableProps) {
	return (
		<NavList {...props} direction="vertical">
			{(props) => <MachineList {...props} />}
		</NavList>
	);
}
