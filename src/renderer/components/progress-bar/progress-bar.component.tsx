import { useMemo } from "react";
import styles from "./progress-bar.module.scss";

interface Props {
	min?: number;
	max: number;
	value: number;
}

export function ProgressBar({ min, max, value }: Props) {
	const decimal = useMemo(() => {
		min = min ?? 0;
		return (value - min) / (max - min);
	}, [min, max, value]);

	return (
		<div className={styles.bar}>
			<div className={styles.contents}>
				<div
					className={styles.progress}
					style={{
						width: `${decimal * 100}%`,
					}}
				/>
				<div
					className={styles.hidden}
					style={{
						width: `${(1 - decimal) * 100}%`,
					}}
				/>
			</div>
		</div>
	);
}
