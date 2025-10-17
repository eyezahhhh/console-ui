import Machine from "@component/machine";
import styles from "./machine-grid.module.scss";
import IFocusableProps from "@interface/focusable-props.interface";
import useMachines from "@hook/machines.hook";
import NavGrid from "@component/nav-grid";
import { useMemo } from "react";

interface Props extends IFocusableProps {}

export function MachineGrid({ setUnfocused, parentKey, index }: Props) {
	const machines = useMachines();

	const machineComponents = useMemo(() => {
		return machines.map((machine) => (props: IFocusableProps) => (
			<Machine {...props} machine={machine} key={machine.config.address} />
		));
	}, [machines]);

	return (
		<NavGrid
			rowContainerClassName={styles.container}
			setUnfocused={setUnfocused}
			parentKey={parentKey}
			index={index}
			maxColumnWidth={500}
			columnGap={20}
		>
			{machineComponents}
		</NavGrid>
	);
}
