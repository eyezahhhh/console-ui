import GamepadButtonId from "@enum/gamepad-button-id.enum";
import { Emitter } from "@util/emitter.util";

interface GamepadState {
	buttons: Map<GamepadButtonId, boolean>;
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
			console.log("Loaded new gamepad");
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

		return {
			buttons,
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
