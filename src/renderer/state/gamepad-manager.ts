import GamepadButtonId from "@enum/gamepad-button-id.enum";
import Emitter from "@util/emitter.util";

interface GamepadState {
	buttons: Map<GamepadButtonId, boolean>;
}

type GamepadManagerEvents = {
	buttonpressed: [GamepadButtonId, number]; // button id, controller index
	buttonreleased: [GamepadButtonId, number]; // button id, controller index
	buttonchanged: [GamepadButtonId, boolean, number]; // button id, button pressed, controller index
};

export class GamepadManager extends Emitter<GamepadManagerEvents> {
	private static instance: GamepadManager | null;

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
			console.log("Loaded new gamepad");
			this.gamepadStates.set(
				event.gamepad.index,
				this.getGamepadState(event.gamepad),
			);
		});

		window.addEventListener("gamepaddisconnected", (event) => {
			console.log("Unloaded gamepad");
			this.gamepadStates.delete(event.gamepad.index);
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
			}
		};
		frame();
	}

	private getGamepads() {
		return navigator.getGamepads().filter((gamepad) => !!gamepad);
	}

	private getGamepadState(gamepad: Gamepad): GamepadState {
		const buttons = new Map<GamepadButtonId, boolean>();

		for (let [i, button] of gamepad.buttons.entries()) {
			buttons.set(i, button.pressed);
		}

		return {
			buttons,
		};
	}
}
