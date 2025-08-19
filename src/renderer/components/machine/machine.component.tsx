import { useMemo } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";
import useNavigatable from "@hook/navigatable.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { cc } from "@util/string.util";
import useFocusStore from "@state/focus.store";

interface Props extends IFocusableProps {
	machine?: IMachine;
}

export function Machine({ machine, parentKey, setUnfocused, index }: Props) {
	const { ref, key, isFocused } = useNavigatable(
		parentKey,
		index,
		setUnfocused,
	);
	const { setFocused } = useFocusStore();

	const name = useMemo(() => {
		return machine?.name || machine?.address || "Unknown Machine";
	}, [machine]);

	return (
		<button
			className={cc(styles.container, isFocused && styles.focused)}
			ref={ref}
			onClick={() => setFocused(key)}
		>
			<div className={styles.content}>
				<span className={styles.title}>{name}</span>
			</div>
		</button>
	);
}
