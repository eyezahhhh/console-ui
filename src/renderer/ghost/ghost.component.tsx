import styles from "./ghost.module.scss";

interface Props {
	className?: string;
}

export function Ghost({ className }: Props) {
	return (
		<div className={className}>
			<div className={styles.container} />
		</div>
	);
}
