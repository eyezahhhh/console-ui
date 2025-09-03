import IFocusableProps from "@interface/focusable-props.interface";
import useNavigatable from "@hook/navigatable.hook";
import MovementAction from "@enum/movement-action.enum";
import { cc } from "@util/string.util";
import useFocusStore from "@state/focus.store";
import { useEffect } from "react";

export interface Props extends IFocusableProps {
	children?: React.ReactNode;
	className?: string;
	focusedClassName?: string;
	disabledClassName?: string;
	focusOnCreate?: boolean;
	disabled?: boolean;
	onMoveUp?: ((key: {}) => void) | false | null;
	onMoveDown?: ((key: {}) => void) | false | null;
	onMoveLeft?: ((key: {}) => void) | false | null;
	onMoveRight?: ((key: {}) => void) | false | null;
	onEnter?: ((key: {}) => void) | false | null;
	onBack?: ((key: {}) => void) | false | null;
	onMenu?: ((key: {}) => void) | false | null;
	onOptions?: ((key: {}) => void) | false | null;
	onDelete?: ((key: {}) => void) | false | null;
}

export function Clickable({
	parentKey,
	setUnfocused,
	index,
	children,
	className,
	focusedClassName,
	disabledClassName,
	focusOnCreate,
	disabled,
	onMoveUp,
	onMoveDown,
	onMoveLeft,
	onMoveRight,
	onEnter,
	onBack,
	onMenu,
	onOptions,
	onDelete,
}: Props) {
	const move = (action: MovementAction) => {
		if (action == MovementAction.ENTER) {
			setFocused(key, action);
		}

		const callbacks: Record<
			MovementAction,
			((key: {}) => void) | undefined | false | null
		> = {
			[MovementAction.UP]: onMoveUp,
			[MovementAction.DOWN]: onMoveDown,
			[MovementAction.LEFT]: onMoveLeft,
			[MovementAction.RIGHT]: onMoveRight,
			[MovementAction.ENTER]: onEnter,
			[MovementAction.BACK]: onBack,
			[MovementAction.MENU]: onMenu,
			[MovementAction.OPTIONS]: onOptions,
			[MovementAction.DELETE]: onDelete,
		};

		const callback = callbacks[action];
		if (callback) {
			callback(key);
		} else {
			setUnfocused(action);
		}
	};

	const { ref, key, isFocused, isRegistered } = useNavigatable(
		parentKey,
		index,
		move,
	);
	const { setFocused } = useFocusStore();

	useEffect(() => {
		if (focusOnCreate && key && isRegistered) {
			setFocused(key, MovementAction.ENTER);
		}
	}, [focusOnCreate, key, isRegistered]);

	return (
		<button
			ref={ref}
			className={cc(
				className,
				isFocused && focusedClassName,
				disabled && disabledClassName,
			)}
			onClick={() => move(MovementAction.ENTER)}
			onContextMenu={() => move(MovementAction.OPTIONS)}
		>
			{children}
		</button>
	);
}
