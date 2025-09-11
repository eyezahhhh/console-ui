import MovementAction from "@enum/movement-action.enum";
import { getMousePosition } from "@hook/mouse-position.hook";
import { create } from "zustand";
import useContextMenuStore from "./context-menu.store";

export type Connection = {
	parent: {} | null;
	index: number;
	ref: HTMLElement;
	key: {};
	move: (action: MovementAction) => void;
	focusable: boolean;
	children: {}[];
};

interface IFocusState {
	focusedComponent: Connection | null;
	lastFocusedComponent: Connection | null;
	lastAction: MovementAction;
	readonly hooks: Map<{}, Connection>;
	registerElement: (options: {
		key: {};
		parentKey: {} | null;
		index: number;
		ref: HTMLElement;
		move: (action: MovementAction) => void;
		focusable: boolean;
	}) => () => void;
	setFocused: (key: {}, action: MovementAction) => boolean;
	setFocusedFromParent: (
		parentKey: {},
		index: number,
		action: MovementAction,
	) => boolean;
	getChildrenOf: (parentKey: {}) => Connection[];
	isFocusedChildOf: (parentKey: {}) => boolean;
	traverse: (key: {}) => Connection[];
	getTargetLocation: (connection?: Connection | null) => [number, number];
	focusPosition: [number, number];
}

const useFocusStore = create<IFocusState>((set, get) => ({
	focusedComponent: null,
	lastFocusedComponent: null,
	lastAction: MovementAction.ENTER,
	hooks: new Map(),
	focusPosition: [0, 0] as [number, number],
	registerElement: ({ key, parentKey, index, ref, move, focusable }) => {
		get().hooks.set(key, {
			parent: parentKey,
			index,
			ref,
			key,
			focusable,
			move,
			children: get()
				.getChildrenOf(key)
				.map((child) => child.key),
		});

		if (parentKey) {
			const parent = get().hooks.get(parentKey);
			if (parent && !parent.children.includes(key)) {
				parent.children.push(key);
			}
		}

		return () => {
			const connection = get().hooks.get(key);
			get().hooks.delete(key);
			let wasFocused = get().focusedComponent?.key === key;
			if (!wasFocused) {
				const menuState = useContextMenuStore.getState();
				if (get().isFocusedChildOf(menuState.popupKey)) {
					if (menuState.menu?.key === key) {
						wasFocused = true;
					}
				}
			}

			if (connection?.parent) {
				const parentConnection = get().hooks.get(connection.parent);
				if (parentConnection) {
					const index = parentConnection.children.indexOf(key);
					if (index >= 0) {
						parentConnection.children.splice(index, 1);
					}
				}
			}

			if (wasFocused) {
				let traversalKey = connection?.parent || null;
				while (traversalKey) {
					const connection = get().hooks.get(traversalKey);
					if (!connection) {
						break;
					}
					if (connection.focusable) {
						set((oldState) => ({
							lastFocusedComponent: oldState.focusedComponent,
							focusedComponent: connection,
						}));
						return;
					}
					traversalKey = connection.parent;
				}

				set((oldState) => ({
					lastFocusedComponent: oldState.focusedComponent,
					focusedComponent: null,
				}));
			}
		};
	},
	setFocused: (key, action) => {
		let connection = get().hooks.get(key);
		if (!connection) {
			console.error(`Failed to find and focus component`);
			return false;
		}
		if (!connection.focusable) {
			console.error("Component isn't directly focusable (direct)");

			const connections = get()
				.traverse(key)
				.filter((connection) => connection.focusable);
			const target = get().getTargetLocation();
			const connectionPositions = connections.map((connection) => {
				const box = connection.ref.getBoundingClientRect();
				const position = [box.x + box.width / 2, box.y + box.height / 2];
				const distance =
					Math.abs(position[0] - target[0]) + Math.abs(position[1] - target[1]);
				return {
					connection,
					position,
					distance,
				};
			});
			if (!connectionPositions.length) {
				console.error("Component doesn't have any focusable children");
				return false;
			}
			connectionPositions.sort((a, b) => a.distance - b.distance);

			set((oldState) => ({
				lastFocusedComponent: oldState.focusedComponent,
				focusedComponent: {
					...connectionPositions[0].connection,
				},
				lastAction: action,
				focusPosition: get().getTargetLocation(
					connectionPositions[0].connection,
				),
			}));
			return true;
		} else {
			set((oldState) => ({
				lastFocusedComponent: oldState.focusedComponent,
				focusedComponent: {
					...connection,
					key,
				},
				lastAction: action,
				focusPosition: get().getTargetLocation(connection),
			}));
			return true;
		}
	},
	setFocusedFromParent: (parentKey, index, action) => {
		const connections = Array.from(get().hooks.entries());
		const connectionInfo = connections.find(
			([_key, connection]) =>
				connection.parent === parentKey && connection.index == index,
		);
		if (!connectionInfo) {
			console.error("Failed to find and focus component from parent");
			return false;
		}
		if (!connectionInfo[1].focusable) {
			console.error("Component isn't directly focusable (from parent)");

			const connections = get()
				.traverse(connectionInfo[0])
				.filter((connection) => connection.focusable);
			const target = get().getTargetLocation();
			let connectionPositions = connections.map((connection) => {
				const box = connection.ref.getBoundingClientRect();
				const position = [box.x + box.width / 2, box.y + box.height / 2];
				const distanceX = Math.abs(position[0] - target[0]);
				const distanceY = Math.abs(position[1] - target[1]);
				const distance = distanceX + distanceY;

				return {
					connection,
					position,
					distanceX,
					distanceY,
					distance,
				};
			});

			if (!connectionPositions.length) {
				console.error("Component doesn't have any focusable children");
				return false;
			}

			// if vertical movement, find component that's nearest vertically
			if (action == MovementAction.UP || action == MovementAction.DOWN) {
				connectionPositions.sort((a, b) => a.distanceY - b.distanceY);
				const shortestDistance = connectionPositions[0].distanceY;
				connectionPositions = connectionPositions.filter(
					(connection) => connection.distanceY <= shortestDistance,
				);
			}
			// if horizontal movement, find component that's nearest horizontally
			if (action == MovementAction.LEFT || action == MovementAction.RIGHT) {
				connectionPositions.sort((a, b) => a.distanceX - b.distanceX);
				const shortestDistance = connectionPositions[0].distanceX;
				connectionPositions = connectionPositions.filter(
					(connection) => connection.distanceX <= shortestDistance,
				);
			}

			// if multiple components are equally near (or movement wasn't horizontal/vertical), select the nearest one
			if (connectionPositions.length > 1) {
				connectionPositions.sort((a, b) => a.distance - b.distance);
			}

			set((oldState) => ({
				lastFocusedComponent: oldState.focusedComponent,
				focusedComponent: {
					...connectionPositions[0].connection,
				},
				lastAction: action,
				focusPosition: get().getTargetLocation(
					connectionPositions[0].connection,
				),
			}));
			return true;
		} else {
			set((oldState) => ({
				lastFocusedComponent: oldState.focusedComponent,
				focusedComponent: {
					...connectionInfo[1],
					key: connectionInfo[0],
				},
				lastAction: action,
				focusPosition: get().getTargetLocation(connectionInfo[1]),
			}));
			return true;
		}
	},
	getChildrenOf: (parentKey) => {
		const all = Array.from(get().hooks.values());
		return all.filter((connection) => connection.parent === parentKey);
	},
	isFocusedChildOf: (parentKey) => {
		let component: Connection | null = get().focusedComponent;
		const traversed: {}[] = [];

		while (component) {
			if (traversed.includes(component.key)) {
				console.error("Component loop detected!");
				return false;
			}
			traversed.push(component.key);

			if (component.key == parentKey) {
				return true;
			}
			if (!component.parent) {
				return false;
			}
			if (component.parent == parentKey) {
				return true;
			}
			component = get().hooks.get(component.parent) || null;
		}
		return false;
	},
	traverse: (key) => {
		const keys = [key];
		const traversed: {}[] = [];
		const connections: Connection[] = [];
		const hooks = get().hooks;

		while (keys.length) {
			const key = keys.shift()!;
			if (traversed.includes(key)) {
				continue;
			}
			traversed.push(key);
			const connection = hooks.get(key);
			if (!connection) {
				continue;
			}
			connections.push(connection);
			keys.push(...connection.children);
		}

		return connections;
	},
	getTargetLocation: (connection?: Connection | null) => {
		if (!connection) {
			connection = get().focusedComponent;
		}
		if (connection) {
			const box = connection.ref.getBoundingClientRect();
			return [box.x + box.width / 2, box.y + box.height / 2];
		}
		return getMousePosition();
	},
}));

export default useFocusStore;
