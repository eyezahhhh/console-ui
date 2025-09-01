import { JSX } from "react";
import styles from "./top-menu-button.module.scss";
import IFocusableProps from "@interface/focusable-props.interface";
import Clickable from "@component/clickable";

type Props = IFocusableProps & {
	onEnter?: (key: {}) => void;
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
	onEnter,
	...props
}: Props) {
	return (
		<Clickable
			parentKey={parentKey}
			setUnfocused={setUnfocused}
			index={index}
			className={styles.button}
			focusedClassName={styles.focused}
			onEnter={onEnter}
		>
			{"children" in props ? (
				props.children
			) : (
				<div className={styles.icon}>{props.icon}</div>
			)}
		</Clickable>
	);
}
