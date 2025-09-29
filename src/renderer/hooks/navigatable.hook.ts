import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useFocusStore, { Connection } from "@state/focus.store";
import MovementAction from "@enum/movement-action.enum";
import useGamepads from "./gamepads.hook";
import GamepadButtonId from "../../shared/enum/gamepad-button-id.enum";
import GamepadJoystickDirection from "@enum/gamepad-joystick-direction.enum";

interface Props {
	onFocus?: (fromComponent: Connection | null, action: MovementAction) => void;
	dontFocusElement?: boolean;
	disabled?: boolean;
	focusable?: boolean;
	isRoot?: boolean;
}

export default function useNavigatable<T extends HTMLElement>(
	parentKey: {} | null,
	index: number,
	onMoveAction: (action: MovementAction) => void,
	{ onFocus, dontFocusElement, disabled, focusable, isRoot }: Props = {},
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
			if (key !== focusedComponent?.key && !isRoot) {
				return;
			}
			const buttons: Partial<Record<GamepadButtonId, MovementAction>> = {
				[GamepadButtonId.D_UP]: MovementAction.UP,
				[GamepadButtonId.D_DOWN]: MovementAction.DOWN,
				[GamepadButtonId.D_LEFT]: MovementAction.LEFT,
				[GamepadButtonId.D_RIGHT]: MovementAction.RIGHT,
				[GamepadButtonId.B]: MovementAction.BACK,
				[GamepadButtonId.A]: MovementAction.ENTER,
				[GamepadButtonId.X]: MovementAction.DELETE,
				[GamepadButtonId.Y]: MovementAction.OPTIONS,
			};

			const action = buttons[buttonId];
			if (action) {
				onMoveAction(action);
			}
		},
		onJoystickDirection(joystickIndex, direction) {
			if (key !== focusedComponent?.key && !isRoot) {
				return;
			}

			// joystick #0 is normally the movement joystick
			if (joystickIndex) {
				return;
			}
			const directions: Partial<
				Record<GamepadJoystickDirection, MovementAction>
			> = {
				[GamepadJoystickDirection.UP]: MovementAction.UP,
				[GamepadJoystickDirection.DOWN]: MovementAction.DOWN,
				[GamepadJoystickDirection.LEFT]: MovementAction.LEFT,
				[GamepadJoystickDirection.RIGHT]: MovementAction.RIGHT,
			};
			const action = directions[direction];
			if (action) {
				onMoveAction(action);
			}
		},
	});

	useEffect(() => {
		if (!ref || disabled) {
			return;
		}

		const deregister = registerElement({
			key,
			parentKey,
			index,
			ref,
			move,
			focusable: focusable !== false,
		});
		setIsRegistered(true);

		return () => {
			setIsRegistered(false);
			deregister();
		};
	}, [ref, key, parentKey, index, move, !!disabled, focusable]);

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
				Enter: event.shiftKey ? MovementAction.OPTIONS : MovementAction.ENTER,
				Escape: MovementAction.BACK,
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
