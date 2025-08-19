import useMachinesStore from "@state/machines.store";
import Machine from "@component/machine";
import styles from "./machine-list.module.scss";
import NavList from "@component/nav-list";
import IFocusableProps from "@interface/focusable-props.interface";

interface Props extends IFocusableProps {}

export function MachineList({ setUnfocused, parentKey, index }: Props) {
	const { machines } = useMachinesStore();

	return (
		<NavList
			direction="horizontal"
			className={styles.container}
			setUnfocused={setUnfocused}
			parentKey={parentKey}
			index={index}
		>
			{machines.map((machine) => (props) => (
				<Machine {...props} machine={machine} key={machine.address} />
			))}
		</NavList>
	);
}
