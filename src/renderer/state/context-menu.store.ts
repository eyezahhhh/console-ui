import { create } from "zustand";

export interface Menu {
	ref: HTMLElement;
	options: Record<string, string>;
}

interface IContextMenuState {
	menu: Menu | null;
	setMenu: (menu: Menu | null) => () => void;
	popupKey: {};
	setPopupKey: (key: {}) => void;
}

const useContextMenuStore = create<IContextMenuState>((set, get) => ({
	menu: null,
	setMenu: (menu) => {
		set({ menu });

		return () => {
			// close menu if it hasn't already
			if (get().menu == menu) {
				set({
					menu: null,
				});
			}
		};
	},
	popupKey: {},
	setPopupKey: (key) => set({ popupKey: key }),
}));

export default useContextMenuStore;
