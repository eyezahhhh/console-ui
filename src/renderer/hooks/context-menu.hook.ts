import useContextMenuStore, { Menu } from "@state/context-menu.store";
import { useMemo, useCallback, useLayoutEffect, useRef } from "react";

export default function useContextMenu(
	createMenu: (key: {}) => Menu<Record<string, string>>,
) {
	const { menu: currentMenu, setMenu } = useContextMenuStore();
	const menuKey = useRef<{} | null>(null);

	const isActive = useMemo(() => {
		return currentMenu?.key === menuKey;
	}, [currentMenu, menuKey]);

	const updateAndShowMenu = useCallback(
		(noRefocus: boolean) => {
			let key = menuKey.current;
			if (!key) {
				return;
			}
			const menu = createMenu(key);
			setMenu(menu, noRefocus);
		},
		[createMenu, setMenu],
	);

	useLayoutEffect(() => {
		if (isActive) {
			updateAndShowMenu(true);
		}
	}, [updateAndShowMenu, isActive]);

	const openMenu = useCallback(
		(key: {}) => {
			// setMenuKey(key);
			menuKey.current = key;
			updateAndShowMenu(false);
		},
		[updateAndShowMenu],
	);

	return openMenu;
}
