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
}
