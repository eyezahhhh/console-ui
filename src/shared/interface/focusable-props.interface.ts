import MovementAction from "../enum/movement-action.enum";

export default interface IFocusableProps {
	setUnfocused: (action: MovementAction) => void;
	parentKey: {};
	index: number;
}
