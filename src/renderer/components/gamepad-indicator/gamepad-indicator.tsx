import useGamepad from "@hook/gamepad.hook";
import styles from "./gamepad-indicator.module.scss";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { cc } from "@util/string.util";
import { useCallback, useEffect, useState } from "react";
import useGamepads from "@hook/gamepads.hook";
import GamepadButtonId from "@enum/gamepad-button-id.enum";

interface Props {
	gamepadIndex: number;
}

export function GamepadIndicator({ gamepadIndex }: Props) {
	const gamepad = useGamepad(gamepadIndex);
	const [bouncer, setBouncer] = useState<HTMLDivElement | null>(null);
	const [bounceStart, setBounceStart] = useState(-1);
	const onButtonPress = useCallback(
		(_buttonId: GamepadButtonId, index: number) => {
			if (index != gamepadIndex) {
				return;
			}
			setBounceStart(Date.now());
		},
		[gamepadIndex],
	);
	useGamepads({
		onButtonPress,
	});

	useEffect(() => {
		if (!bouncer || bounceStart < 0) {
			return;
		}

		bouncer.classList.remove(styles.bouncing);
		void bouncer.offsetWidth; // trigger reflow
		bouncer.classList.add(styles.bouncing);
	}, [bounceStart, bouncer]);

	return (
		<div className={cc(styles.container, !gamepad && styles.disabled)}>
			<div className={styles.bouncer} ref={setBouncer}>
				<SportsEsportsIcon className={styles.icon} />
			</div>
		</div>
	);
}
