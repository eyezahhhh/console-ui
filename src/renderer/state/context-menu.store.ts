import { create } from "zustand";
import useFocusStore from "./focus.store";
import MovementAction from "@enum/movement-action.enum";

export type Menu<T extends Record<string, string>> = {
	ref: HTMLElement;
	key: {};
	options: T;
	onSelect: (option: keyof T) => void;
};

interface IContextMenuState {
	menu: Menu<Record<string, string>> | null;
	setMenu: <T extends Record<string, string>>(
		menu: Menu<T> | null,
		noRefocus?: boolean,
	) => void;
	popupKey: {};
	setPopupKey: (key: {}) => void;
}

const useContextMenuStore = create<IContextMenuState>((set) => ({
	menu: null,
	setMenu: (menu, noRefocus) => {
		if (menu && !noRefocus) {
			useFocusStore.getState().setFocused(menu.key, MovementAction.OPTIONS);
		}
		set({ menu });
	},
	popupKey: {},
	setPopupKey: (key) => set({ popupKey: key }),
}));

export default useContextMenuStore;
