import { create } from "zustand";

export type Connection = {
	parent: {} | null;
	index: number;
	ref: HTMLElement;
};

export type FocusedConnection = Connection & {
	key: {};
};

interface IFocusState {
	focusedComponent: FocusedConnection | null;
	lastFocusedComponent: FocusedConnection | null;
	readonly hooks: Map<{}, Connection>;
	registerElement: (
		key: {},
		parentKey: {} | null,
		index: number,
		ref: HTMLElement,
	) => () => void;
	setFocused: (key: {}) => void;
	setFocusedFromParent: (parentKey: {}, index: number) => void;
	getChildrenOf: (parentKey: {}) => Connection[];
}

const useFocusStore = create<IFocusState>((set, get) => ({
	focusedComponent: null,
	lastFocusedComponent: null,
	hooks: new Map(),
	registerElement: (key, parentKey, index, ref) => {
		get().hooks.set(key, {
			parent: parentKey,
			index,
			ref,
		});

		return () => {
			const connection = get().hooks.get(key);
			get().hooks.delete(key);
			if (get().focusedComponent?.key === key) {
				if (connection?.parent) {
					const parentConnection = get().hooks.get(connection.parent);
					if (parentConnection) {
						set((oldState) => ({
							lastFocusedComponent: oldState.focusedComponent,
							focusedComponent: {
								...parentConnection,
								key: connection.parent!,
							},
						}));
					}
				}
			}
		};
	},
	setFocused: (key) => {
		const connection = get().hooks.get(key);
		if (!connection) {
			console.error(`Failed to find and focus component`);
			return;
		}

		set((oldState) => ({
			lastFocusedComponent: oldState.focusedComponent,
			focusedComponent: {
				...connection,
				key,
			},
		}));
	},
	setFocusedFromParent: (parentKey, index) => {
		const connections = Array.from(get().hooks.entries());
		const connectionInfo = connections.find(
			([_key, connection]) =>
				connection.parent === parentKey && connection.index == index,
		);
		if (!connectionInfo) {
			console.error("Failed to find and focus component from parent");
			return;
		}

		set((oldState) => ({
			lastFocusedComponent: oldState.focusedComponent,
			focusedComponent: {
				...connectionInfo[1],
				key: connectionInfo[0],
			},
		}));
	},
	getChildrenOf: (parentKey) => {
		const all = Array.from(get().hooks.values());
		return all.filter((connection) => connection.parent === parentKey);
	},
}));

export default useFocusStore;
