import MovementAction from "@enum/movement-action.enum";
import useNavigatable from "@hook/navigatable.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./dropdown.module.scss";
import { cc } from "@util/string.util";
import { useEffect, useMemo, useState } from "react";
import NavList from "@component/nav-list";
import Button from "@component/button";
import useFocusStore from "@state/focus.store";

interface Props extends IFocusableProps {
	options: string[];
	selectedIndex: number;
	onSelect?: (index: number) => void;
}

export function Dropdown({
	parentKey,
	setUnfocused,
	index,
	options,
	selectedIndex,
	onSelect,
}: Props) {
	const move = (action: MovementAction) => {
		if (action == MovementAction.ENTER) {
			setIsOpen((open) => !open);
		} else {
			setUnfocused(action);
		}
	};

	const { key, isFocused, ref } = useNavigatable(parentKey, index, move);
	const listKey = useMemo(() => ({}), []);
	const {
		setFocusedFromParent,
		setFocused,
		focusedComponent,
		isFocusedChildOf,
	} = useFocusStore();
	const selected = useMemo(() => {
		if (selectedIndex < 0 || selectedIndex >= options.length) {
			return null;
		}
		return options[selectedIndex];
	}, [options, selectedIndex]);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setFocusedFromParent(listKey, 0);
		} else if (isFocusedChildOf(listKey)) {
			setFocused(key);
		}
	}, [isOpen, key]);

	useEffect(() => {
		if (isOpen) {
			if (!isFocusedChildOf(key) && !isFocusedChildOf(listKey)) {
				setIsOpen(false);
			}
		}
	}, [isOpen, focusedComponent]);

	return (
		<div
			className={cc(
				styles.container,
				isFocused && styles.focused,
				isOpen && styles.open,
			)}
			onClick={() => move(MovementAction.ENTER)}
		>
			<button className={styles.preview} ref={ref}>
				{selected ?? "Select..."}
			</button>
			<div className={styles.optionsContainer}>
				<NavList
					className={styles.options}
					direction="vertical"
					parentKey={listKey}
					index={0}
					setUnfocused={() => {}}
				>
					{options.map((option, index) => (props) => (
						<Button
							{...props}
							className={styles.option}
							focusedClassName={styles.focused}
							setUnfocused={(action) => {
								if (action == MovementAction.ENTER) {
									onSelect?.(index);
								}
								if (
									action == MovementAction.BACK ||
									action == MovementAction.ENTER ||
									(action == MovementAction.UP && !index)
								) {
									setIsOpen(false);
									return;
								}

								props.setUnfocused(action);
							}}
						>
							{option}
						</Button>
					))}
				</NavList>
			</div>
		</div>
	);
}
