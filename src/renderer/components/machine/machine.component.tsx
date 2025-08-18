import { useMemo } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";

interface Props {
	machine?: IMachine;
}

export function Machine({ machine }: Props) {
	const name = useMemo(() => {
		return machine?.name || machine?.address || "Unknown Machine";
	}, [machine]);

	return (
		<button className={styles.container}>
			<div className={styles.content}>
				<span className={styles.title}>{name}</span>
			</div>
		</button>
	);
}
