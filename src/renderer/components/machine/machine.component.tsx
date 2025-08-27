import { useMemo } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";
import useNavigatable from "@hook/navigatable.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { cc } from "@util/string.util";
import useFocusStore from "@state/focus.store";
import MovementAction from "@enum/movement-action.enum";
import { useNavigate } from "react-router";
import Button from "@component/button";

interface Props extends IFocusableProps {
	machine?: IMachine;
}

export function Machine({ machine, parentKey, setUnfocused, index }: Props) {
	const navigate = useNavigate();
	const name = useMemo(() => {
		return machine?.name || machine?.address || "Unknown Machine";
	}, [machine]);

	return (
		<Button
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
		</Button>
	);
}
