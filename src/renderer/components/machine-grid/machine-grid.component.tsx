import Machine from "@component/machine";
import styles from "./machine-grid.module.scss";
import IFocusableProps from "@interface/focusable-props.interface";
import useMachines from "@hook/machines.hook";
import NavGrid from "@component/nav-grid";

interface Props extends IFocusableProps {}

export function MachineGrid({ setUnfocused, parentKey, index }: Props) {
	const machines = useMachines();

	return (
		<NavGrid
			rowContainerClassName={styles.container}
			setUnfocused={setUnfocused}
			parentKey={parentKey}
			index={index}
			maxColumnWidth={500}
			columnGap={20}
		>
			{machines.map((machine) => (props) => (
				<Machine {...props} machine={machine} key={machine.config.address} />
			))}
		</NavGrid>
	);
}
