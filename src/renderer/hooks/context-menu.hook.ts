import useContextMenuStore, { Menu } from "@state/context-menu.store";
import { useState, useMemo, useEffect, useCallback } from "react";

export default function useContextMenu(
	createMenu: (key: {}) => Menu<Record<string, string>>,
) {
	const { menu: currentMenu, setMenu } = useContextMenuStore();
	const [menuKey, setMenuKey] = useState<{} | null>(null);

	const isActive = useMemo(() => {
		return currentMenu?.key === menuKey;
	}, [currentMenu, menuKey]);

	const updateAndShowMenu = useCallback(
		(noRefocus: boolean) => {
			if (!menuKey) {
				return;
			}
			const menu = createMenu(menuKey);
			setMenu(menu, noRefocus);
		},
		[createMenu, menuKey, setMenu],
	);

	useEffect(() => {
		if (isActive) {
			updateAndShowMenu(true);
		}
	}, [updateAndShowMenu, isActive]);

	const openMenu = useCallback(
		(key: {}) => {
			setMenuKey(key);
			updateAndShowMenu(false);
		},
		[updateAndShowMenu],
	);

	return openMenu;
}
