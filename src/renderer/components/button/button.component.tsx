import { cc } from "@util/string.util";
import Clickable, { Props } from "@component/clickable";
import styles from "./button.module.scss";

export function Button(props: Props) {
	const { children, className, focusedClassName, disabledClassName } = props;

	return (
		<Clickable
			{...props}
			className={cc(styles.button, className)}
			focusedClassName={cc(styles.focused, focusedClassName)}
			disabledClassName={cc(styles.disabled, disabledClassName)}
		>
			{children}
		</Clickable>
	);
}
