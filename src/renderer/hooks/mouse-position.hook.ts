import { StandaloneEmitter } from "@util/emitter.util";
import { useEffect, useState } from "react";

const emitter = new StandaloneEmitter<{
	position: [[number, number]];
}>();
let _position: [number, number] = [0, 0];

document.addEventListener("mousemove", (e) => {
	_position = [e.clientX, e.clientY];
	emitter.emit("position", _position);
});

export default function useMousePosition() {
	const [position, setPosition] = useState(_position);

	useEffect(() => {
		emitter.addEventListener("position", setPosition);

		return () => {
			emitter.removeEventListener("position", setPosition);
		};
	}, []);

	return position;
}

export function getMousePosition(): [number, number] {
	return [..._position];
}
