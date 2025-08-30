import NavList from "@component/nav-list";
import useGamepads from "@hook/gamepads.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { useState } from "react";
import styles from "./gamepad-debug.module.scss";

export function GamepadDebugPage(props: IFocusableProps) {
	const [gamepads, setGamepads] = useState<Gamepad[]>([]);
	useGamepads({
		onPoll: setGamepads,
	});

	return (
		<NavList {...props} direction="vertical" className={styles.container}>
			{gamepads.map((gamepad) => (props) => (
				<NavList
					{...props}
					key={gamepad.index}
					direction="vertical"
					className={styles.gamepadSection}
				>
					<span className={styles.index}>
						{gamepad.index} - {gamepad.connected ? "Connected" : "Disconnected"}
					</span>
					<span className={styles.id}>{gamepad.id}</span>
					<div className={styles.section}>
						{gamepad.buttons.map((button, index) => (
							<span key={index}>
								Button {index} - {button.value}
							</span>
						))}
					</div>
				</NavList>
			))}
		</NavList>
	);
}
