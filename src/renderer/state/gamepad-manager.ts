import GamepadButtonId from "@enum/gamepad-button-id.enum";
import { Emitter } from "@util/emitter.util";
import GamepadJoystickDirection from "@enum/gamepad-joystick-direction.enum";

interface GamepadState {
	buttons: Map<GamepadButtonId, boolean>;
	joysticks: GamepadJoystickDirection[];
}

interface GamepadInfo {
	name: string;
	mapping: (GamepadButtonId | null)[];
}

type GamepadManagerEvents = {
	buttonpressed: [GamepadButtonId, number]; // button id, controller index
	buttonreleased: [GamepadButtonId, number]; // button id, controller index
	buttonchanged: [GamepadButtonId, boolean, number]; // button id, button pressed, controller index
	added: [Gamepad]; // gamepad
	removed: [Gamepad]; // gamepad
	poll: [Gamepad[]]; // gamepads
	joystickdirection: [number, GamepadJoystickDirection, number]; // joystick index, joystick direction, controller index
};

export class GamepadManager extends Emitter<GamepadManagerEvents> {
	private static instance: GamepadManager | null;
	private readonly gamepadInfo = new Map<number, GamepadInfo>();

	public static getInstance() {
		if (!this.instance) {
			this.instance = new GamepadManager();
		}
		return this.instance;
	}

	private readonly gamepadStates = new Map<number, GamepadState>(
		this.getGamepads().map((gamepad) => [
			gamepad.index,
			this.getGamepadState(gamepad),
		]),
	);

	constructor() {
		super();
		console.log(`Loaded ${this.gamepadStates.size} gamepads`);
		window.addEventListener("gamepadconnected", (event) => {
			const name = event.gamepad.id.substring(
				0,
				event.gamepad.id.indexOf(" ("),
			);
			console.log(`Gamepad name: "${name}"`);
			let mapping = DEFAULT_MAPPING;

			if (name == "Nintendo Switch Lite Gamepad") {
				mapping = SWITCH_MAPPING;
			}

			this.gamepadInfo.set(event.gamepad.index, {
				name,
				mapping,
			});
			this.gamepadStates.set(
				event.gamepad.index,
				this.getGamepadState(event.gamepad),
			);
			this.emit("added", event.gamepad);
		});

		window.addEventListener("gamepaddisconnected", (event) => {
			console.log("Unloaded gamepad");
			this.gamepadStates.delete(event.gamepad.index);
			this.emit("removed", event.gamepad);
			this.gamepadInfo.delete(event.gamepad.index);
		});

		const frame = () => {
			requestAnimationFrame(frame);

			const gamepads = this.getGamepads();
			for (let gamepad of gamepads) {
				const state = this.getGamepadState(gamepad);
				const oldState = this.gamepadStates.get(gamepad.index);
				this.gamepadStates.set(gamepad.index, state);
				if (!oldState) {
					continue;
				}

				for (let [button, buttonPressed] of state.buttons) {
					if (oldState.buttons.get(button) != buttonPressed) {
						this.emit("buttonchanged", button, buttonPressed, gamepad.index);
						this.emit(
							buttonPressed ? "buttonpressed" : "buttonreleased",
							button,
							gamepad.index,
						);
					}
				}

				for (let [index, direction] of state.joysticks.entries()) {
					if (oldState.joysticks[index] != direction) {
						this.emit("joystickdirection", index, direction, gamepad.index);
					}
				}
			}

			this.emit("poll", gamepads);
		};
		frame();
	}

	getGamepads() {
		return navigator.getGamepads().filter((gamepad) => !!gamepad);
	}

	private getGamepadState(gamepad: Gamepad): GamepadState {
		const info = this.gamepadInfo.get(gamepad.index);
		if (!info) {
			throw new Error("Gamepad info not set");
		}

		const buttons = new Map<GamepadButtonId, boolean>();

		for (let [i, button] of gamepad.buttons.entries()) {
			const mappedIndex = info.mapping[i];
			if (mappedIndex !== null) {
				buttons.set(mappedIndex, button.pressed);
			}
		}

		const joysticks: GamepadJoystickDirection[] = [];

		for (let i = 0; i < gamepad.axes.length / 2; i++) {
			const x = Math.round(gamepad.axes[i * 2]);
			const y = Math.round(gamepad.axes[i * 2 + 1]);
			if (x == -1) {
				if (y == -1) {
					joysticks.push(GamepadJoystickDirection.UP_LEFT);
				} else if (y == 1) {
					joysticks.push(GamepadJoystickDirection.DOWN_LEFT);
				} else {
					joysticks.push(GamepadJoystickDirection.LEFT);
				}
			} else if (x == 1) {
				if (y == -1) {
					joysticks.push(GamepadJoystickDirection.UP_RIGHT);
				} else if (y == 1) {
					joysticks.push(GamepadJoystickDirection.DOWN_RIGHT);
				} else {
					joysticks.push(GamepadJoystickDirection.RIGHT);
				}
			} else {
				if (y == -1) {
					joysticks.push(GamepadJoystickDirection.UP);
				} else if (y == 1) {
					joysticks.push(GamepadJoystickDirection.DOWN);
				} else {
					joysticks.push(GamepadJoystickDirection.CENTER);
				}
			}
		}

		return {
			buttons,
			joysticks,
		};
	}
}

const DEFAULT_MAPPING: (GamepadButtonId | null)[] = [
	GamepadButtonId.A,
	GamepadButtonId.B,
	GamepadButtonId.X,
	GamepadButtonId.Y,
	GamepadButtonId.LB,
	GamepadButtonId.RB,
	GamepadButtonId.LT,
	GamepadButtonId.RT,
	GamepadButtonId.SELECT,
	GamepadButtonId.START,
	GamepadButtonId.LS,
	GamepadButtonId.RS,
	GamepadButtonId.D_UP,
	GamepadButtonId.D_DOWN,
	GamepadButtonId.D_LEFT,
	GamepadButtonId.D_RIGHT,
	GamepadButtonId.HOME,
];

const SWITCH_MAPPING: (GamepadButtonId | null)[] = [
	GamepadButtonId.A,
	GamepadButtonId.B,
	GamepadButtonId.Y,
	GamepadButtonId.X,
	null,
	GamepadButtonId.LB,
	GamepadButtonId.RB,
	GamepadButtonId.LT,
	GamepadButtonId.RT,
	GamepadButtonId.SELECT,
	GamepadButtonId.START,
	GamepadButtonId.HOME,
	GamepadButtonId.LS,
	GamepadButtonId.RS,
	GamepadButtonId.D_UP,
	GamepadButtonId.D_DOWN,
	GamepadButtonId.D_LEFT,
	GamepadButtonId.D_RIGHT,
];
