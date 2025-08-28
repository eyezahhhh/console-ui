import { useMemo } from "react";
import useGamepads from "./gamepads.hook";

export default function useGamepad(index: number) {
	const gamepads = useGamepads();
	const gamepad = useMemo(() => {
		return gamepads.find((gamepad) => gamepad.index == index) || null;
	}, [gamepads]);

	return gamepad;
}
