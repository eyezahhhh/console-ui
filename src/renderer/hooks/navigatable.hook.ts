import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useFocusStore, { Connection } from "@state/focus.store";
import MovementAction from "@enum/movement-action.enum";
import useGamepads from "./gamepads.hook";
import GamepadButtonId from "../../shared/enum/gamepad-button-id.enum";

export default function useNavigatable<T extends HTMLElement>(
	parentKey: {} | null,
	index: number,
	onMoveAction: (action: MovementAction) => void,
	onFocus?: (fromComponent: Connection | null, action: MovementAction) => void,
	dontFocusElement?: boolean,
) {
	const moveRef = useRef<(action: MovementAction) => void>(onMoveAction);
	useEffect(() => {
		moveRef.current = onMoveAction;
	}, [onMoveAction]);
	const move = useCallback((action: MovementAction) => {
		moveRef.current(action);
	}, []);

	const [ref, setRef] = useState<T | null>(null);
	const [isRegistered, setIsRegistered] = useState(false);
	const key = useMemo(() => ({}), []);
	const {
		focusedComponent,
		registerElement,
		lastFocusedComponent,
		lastAction,
	} = useFocusStore();
	useGamepads({
		onButtonPress(buttonId) {
			if (key !== focusedComponent?.key) {
				return;
			}
			const buttons: Partial<Record<GamepadButtonId, MovementAction>> = {
				[GamepadButtonId.D_UP]: MovementAction.UP,
				[GamepadButtonId.D_DOWN]: MovementAction.DOWN,
				[GamepadButtonId.D_LEFT]: MovementAction.LEFT,
				[GamepadButtonId.D_RIGHT]: MovementAction.RIGHT,
				[GamepadButtonId.B]: MovementAction.BACK,
				[GamepadButtonId.A]: MovementAction.ENTER,
			};

			const action = buttons[buttonId];
			if (action) {
				onMoveAction(action);
			}
		},
	});

	useEffect(() => {
		if (!ref) {
			return;
		}

		const deregister = registerElement(key, parentKey, index, ref, move);
		setIsRegistered(true);

		return () => {
			setIsRegistered(false);
			deregister();
		};
	}, [ref, key, parentKey, index, move]);

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
			if (!dontFocusElement) {
				ref.focus();
			}
			onFocus?.(lastFocusedComponent, lastAction);
		}
	}, [
		ref,
		focusedComponent,
		lastFocusedComponent,
		key,
		onFocus,
		lastAction,
		dontFocusElement,
	]);

	return {
		ref: setRef,
		key,
		isFocused: focusedComponent?.key === key,
		isRegistered,
		element: ref,
		focusedComponent,
	};
}
