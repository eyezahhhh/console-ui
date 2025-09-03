import { useMemo } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";
import IFocusableProps from "@interface/focusable-props.interface";
import { useNavigate } from "react-router";
import Clickable from "@component/clickable";
import { isMachineOnline } from "@util/object.util";

interface Props extends IFocusableProps {
	machine?: IMachine;
}

export function Machine({ machine, parentKey, setUnfocused, index }: Props) {
	const navigate = useNavigate();

	const uuid = useMemo(() => {
		return (machine?.config.discovered && machine.config.uuid) || null;
	}, [machine]);

	const name = useMemo(() => {
		if (machine?.config.discovered) {
			return machine.config.name;
		}
		return machine?.config.address || "Unknown Machine";
	}, [machine]);

	return (
		<Clickable
			parentKey={parentKey}
			setUnfocused={setUnfocused}
			index={index}
			className={styles.container}
			focusedClassName={styles.focused}
			onEnter={
				isMachineOnline(machine || null) && (() => navigate(`/machine/${uuid}`))
			}
		>
			<div className={styles.content}>
				<span className={styles.title}>{name}</span>
			</div>
		</Clickable>
	);
}
