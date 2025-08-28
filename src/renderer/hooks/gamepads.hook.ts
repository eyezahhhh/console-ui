import { useEffect, useMemo, useState } from "react";
import { GamepadManager } from "../state/gamepad-manager";
import GamepadButtonId from "../../shared/enum/gamepad-button-id.enum";

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
}

export default function useGamepads({
	onButtonChange,
	onButtonPress,
	onButtonRelease,
}: Props = {}) {
	const gamepadManager = useMemo(() => GamepadManager.getInstance(), []);
	const [gamepads, setGamepads] = useState(
		GamepadManager.getInstance().getGamepads(),
	);

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

	return gamepads;
}
