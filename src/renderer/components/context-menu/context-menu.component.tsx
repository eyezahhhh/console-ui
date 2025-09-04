import useContextMenuStore from "@state/context-menu.store";
import styles from "./context-menu.module.scss";
import NavList from "@component/nav-list";
import Clickable from "@component/clickable";
import { useEffect, useMemo, useState } from "react";
import useFocusStore from "@state/focus.store";

export function ContextMenu() {
	const { menu, setPopupKey, popupKey, setMenu } = useContextMenuStore();
	const key = useMemo(() => ({}), []);
	const [position, setPosition] = useState<[number, number]>([0, 0]);
	const { focusedComponent, isFocusedChildOf } = useFocusStore();

	useEffect(() => {
		setPopupKey(key);
	}, [key]);

	useEffect(() => {
		setPosition([0, 0]);
		if (!menu) {
			return;
		}
		const element = menu.ref;
		let active = true;

		const updatePosition = () => {
			if (!active) {
				return;
			}
			const rect = element.getBoundingClientRect();
			console.log(rect.x, rect.y);
			setPosition([rect.x, rect.y]);

			setTimeout(() => {
				updatePosition();
			}, 500);
		};

		updatePosition();

		return () => {
			active = false;
		};
	}, [menu]);

	useEffect(() => {
		console.log(menu, isFocusedChildOf(popupKey));
		// if (menu && !isFocusedChildOf(popupKey)) {
		// 	setMenu(null);
		// }
	}, [focusedComponent, popupKey, menu]);

	if (!menu) {
		return null;
	}

	return (
		<div
			className={styles.positioner}
			style={{
				left: `${position[0]}px`,
				top: `${position[1]}px`,
			}}
		>
			<NavList
				direction="vertical"
				parentKey={key}
				index={0}
				className={styles.container}
				setUnfocused={(action) => {
					console.log("Context menu unfocus", action);
				}}
			>
				{Object.entries(menu.options).map(([id, name], index) => (props) => (
					<Clickable
						{...props}
						key={id}
						className={styles.entry}
						focusedClassName={styles.focused}
						focusOnCreate={!index}
					>
						{name}
					</Clickable>
				))}
			</NavList>
		</div>
	);
}
