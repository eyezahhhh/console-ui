import { useCallback, useEffect } from "react";
import useContextMenuStore, { Menu } from "@state/context-menu.store";
import useFocusStore from "@state/focus.store";

export default function useContextMenu() {
	const { setMenu: setContextMenu, popupKey, menu } = useContextMenuStore();
	const { focusedComponent, isFocusedChildOf } = useFocusStore();

	const setMenu = useCallback(
		(menu: Menu, key: {}) => {
			if (focusedComponent?.key != key) {
				console.error(
					"Can't open context menu for component because it isn't focused",
				);
			}
		},
		[setContextMenu, focusedComponent],
	);

	useEffect(() => {
		console.log(menu, isFocusedChildOf(popupKey));
		if (menu && !isFocusedChildOf(popupKey)) {
			setContextMenu(null);
		}
	}, [focusedComponent, popupKey, menu]);

	return {
		setMenu,
	};
}
