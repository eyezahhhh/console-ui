import MovementAction from "@enum/movement-action.enum";
import IFocusableProps from "@interface/focusable-props.interface";
import { useEffect, useMemo, useState } from "react";
import styles from "./modal.module.scss";
import NavList from "@component/nav-list";
import OptionalArray from "@interface/optional-array.interface";
import { cc } from "@util/string.util";
import useFocusStore from "@state/focus.store";

interface Props {
	open: boolean;
	onClose?: () => void;
	children?: OptionalArray<
		false | React.JSX.Element | ((props: IFocusableProps) => React.JSX.Element)
	>;
	className?: string;
}

export function Modal({ open, children, onClose, className }: Props) {
	const move = (action: MovementAction) => {
		if (action == MovementAction.BACK) {
			onClose?.();
		}
	};

	const key = useMemo(() => ({}), []);
	const {
		focusedComponent,
		isFocusedChildOf,
		setFocusedFromParent,
		setFocused,
	} = useFocusStore();

	useEffect(() => {
		setTimeout(() => {
			if (open && !isFocusedChildOf(key)) {
				onClose?.();
			}
		});
	}, [focusedComponent, key, open]);

	useEffect(() => {
		if (open) {
			const lastFocused = useFocusStore.getState().focusedComponent;
			setFocusedFromParent(key, 0, MovementAction.ENTER);

			return () => {
				if (lastFocused) {
					setFocused(lastFocused.key, MovementAction.ENTER);
				}
			};
		}
	}, [open, key]);

	return (
		<div className={cc(styles.container, open && styles.open)}>
			<NavList
				className={cc(styles.modal, className)}
				parentKey={key}
				index={0}
				setUnfocused={move}
				direction="vertical"
			>
				{children}
			</NavList>
		</div>
	);
}
