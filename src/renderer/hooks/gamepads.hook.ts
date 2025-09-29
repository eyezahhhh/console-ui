import { useEffect, useMemo, useState } from "react";
import { GamepadManager } from "../state/gamepad-manager";
import GamepadButtonId from "../../shared/enum/gamepad-button-id.enum";
import GamepadJoystickDirection from "@enum/gamepad-joystick-direction.enum";

interface Props {
	onButtonChange?: (
		buttonId: GamepadButtonId,
		pressed: boolean,
		controllerIndex: number,
	) => void;
	onButtonPress?: (buttonId: GamepadButtonId, controllerIndex: number) => void;
	onButtonRelease?: (
		buttonId: GamepadButtonId,
		controllerIndex: number,
	) => void;
	onPoll?: (gamepads: Gamepad[]) => void;
	onJoystickDirection?: (
		joystickIndex: number,
		joystickDirection: GamepadJoystickDirection,
		controllerIndex: number,
	) => void;
}

export default function useGamepads({
	onButtonChange,
	onButtonPress,
	onButtonRelease,
	onPoll,
	onJoystickDirection,
}: Props = {}) {
	const gamepadManager = useMemo(() => GamepadManager.getInstance(), []);
	const [gamepads, setGamepads] = useState(
		GamepadManager.getInstance().getGamepads(),
	);

	useEffect(() => {
		if (!onPoll) {
			return;
		}
		gamepadManager.addEventListener("poll", onPoll);

		return () => {
			gamepadManager.removeEventListener("poll", onPoll);
		};
	}, [gamepadManager, onPoll]);

	useEffect(() => {
		const addListener = (gamepad: Gamepad) => {
			setGamepads((gamepads) => {
				if (gamepads.some((g) => g.index == gamepad.index)) {
					return gamepads;
				}
				return [...gamepads, gamepad];
			});
		};

		const removeListener = (gamepad: Gamepad) => {
			setGamepads((gamepads) =>
				gamepads.filter((g) => g.index != gamepad.index),
			);
		};

		gamepadManager.addEventListener("added", addListener);
		gamepadManager.addEventListener("removed", removeListener);

		return () => {
			gamepadManager.removeEventListener("added", addListener);
			gamepadManager.removeEventListener("removed", removeListener);
		};
	}, [gamepadManager]);

	useEffect(() => {
		if (!onButtonChange) {
			return;
		}

		gamepadManager.addEventListener("buttonchanged", onButtonChange);
		return () => {
			gamepadManager.removeEventListener("buttonchanged", onButtonChange);
		};
	}, [gamepadManager, onButtonChange]);

	useEffect(() => {
		if (!onButtonPress) {
			return;
		}

		gamepadManager.addEventListener("buttonpressed", onButtonPress);
		return () => {
			gamepadManager.removeEventListener("buttonpressed", onButtonPress);
		};
	}, [gamepadManager, onButtonPress]);

	useEffect(() => {
		if (!onButtonRelease) {
			return;
		}

		gamepadManager.addEventListener("buttonreleased", onButtonRelease);
		return () => {
			gamepadManager.removeEventListener("buttonreleased", onButtonRelease);
		};
	}, [gamepadManager, onButtonRelease]);

	useEffect(() => {
		if (!onJoystickDirection) {
			return;
		}

		gamepadManager.addEventListener("joystickdirection", onJoystickDirection);
		return () => {
			gamepadManager.removeEventListener(
				"joystickdirection",
				onJoystickDirection,
			);
		};
	}, [gamepadManager, onJoystickDirection]);

	return gamepads;
}
