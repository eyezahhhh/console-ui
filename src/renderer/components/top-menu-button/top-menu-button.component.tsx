import { JSX } from "react";
import IFocusableProps from "../../../shared/interface/focusable-props.interface";
import useNavigatable from "../../hooks/navigatable.hook";
import { cc } from "../../utils/string.util";
import styles from "./top-menu-button.module.scss";

type Props = IFocusableProps & {
	onClick?: () => void;
} & (
		| {
				children: JSX.Element;
		  }
		| {
				icon: JSX.Element;
		  }
	);

export function TopMenuButton({
	parentKey,
	setUnfocused,
	index,
	onClick,
	...props
}: Props) {
	const { ref, isFocused } = useNavigatable(parentKey, index, setUnfocused);

	return (
		<button
			className={cc(styles.button, isFocused && styles.focused)}
			ref={ref}
		>
			<div className={styles.content}>
				{"children" in props ? (
					props.children
				) : (
					<div className={styles.icon}>{props.icon}</div>
				)}
			</div>
		</button>
	);
}
