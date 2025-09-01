import { useMemo } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";
import IFocusableProps from "@interface/focusable-props.interface";
import { useNavigate } from "react-router";
import Clickable from "@component/clickable";

interface Props extends IFocusableProps {
	machine?: IMachine;
}

export function Machine({ machine, parentKey, setUnfocused, index }: Props) {
	const navigate = useNavigate();
	const name = useMemo(() => {
		return machine?.name || machine?.address || "Unknown Machine";
	}, [machine]);

	return (
		<Clickable
			parentKey={parentKey}
			setUnfocused={setUnfocused}
			index={index}
			className={styles.container}
			focusedClassName={styles.focused}
			onEnter={machine && (() => navigate(`/machine/${machine.uuid}`))}
		>
			<div className={styles.content}>
				<span className={styles.title}>{name}</span>
			</div>
		</Clickable>
	);
}
