import { useEffect, useMemo, useState } from "react";
import useFocusStore, { FocusedConnection } from "@state/focus.store";
import MovementAction from "@enum/movement-action.enum";

export default function useNavigatable<T extends HTMLElement>(
	parentKey: {} | null,
	index: number,
	onMoveAction: (action: MovementAction) => void,
	onFocus?: (fromComponent: FocusedConnection | null) => void,
) {
	const [ref, setRef] = useState<T | null>(null);
	const key = useMemo(() => ({}), []);
	const { focusedComponent, registerElement, lastFocusedComponent } =
		useFocusStore();

	useEffect(() => {
		if (!ref) {
			return;
		}

		const deregister = registerElement(key, parentKey, index, ref);

		return () => {
			deregister();
		};
	}, [ref, key, parentKey, index]);

	useEffect(() => {
		if (!ref) {
			return;
		}

		const keyListener = (event: KeyboardEvent) => {
			const keys: Record<string, MovementAction> = {
				ArrowUp: MovementAction.UP,
				ArrowDown: MovementAction.DOWN,
				ArrowLeft: MovementAction.LEFT,
				ArrowRight: MovementAction.RIGHT,
				Escape: MovementAction.BACK,
				Enter: MovementAction.ENTER,
			};

			const action = keys[event.key];
			if (action) {
				console.log(action);
				event.preventDefault();
				event.stopPropagation();
				onMoveAction(action);
			}
		};
		ref.addEventListener("keydown", keyListener);

		return () => {
			ref.removeEventListener("keydown", keyListener);
		};
	}, [ref, onMoveAction]);

	useEffect(() => {
		if (ref && focusedComponent?.key === key) {
			ref.focus();
			onFocus?.(lastFocusedComponent);
		}
	}, [ref, focusedComponent, lastFocusedComponent, key, onFocus]);

	return {
		ref: setRef,
		key,
		isFocused: focusedComponent?.key === key,
	};
}
