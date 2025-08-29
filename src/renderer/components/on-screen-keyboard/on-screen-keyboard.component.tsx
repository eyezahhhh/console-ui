import NavList from "@component/nav-list";
import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./on-screen-keyboard.module.scss";
import useFocusStore from "@state/focus.store";
import { useCallback, useEffect } from "react";
import useNavigatable from "@hook/navigatable.hook";
import { cc } from "@util/string.util";
import MovementAction from "@enum/movement-action.enum";

interface KeyProps extends IFocusableProps {
	letter: string;
	focusOnCreate?: boolean;
	onFocus?: (move: (action: MovementAction) => void) => void;
}

function Key({
	parentKey,
	index,
	setUnfocused,
	letter,
	focusOnCreate,
}: KeyProps) {
	const move = useCallback(
		(action: MovementAction) => {
			if (action == MovementAction.ENTER) {
				setFocused(key, action);
			}
			setUnfocused(action);
		},
		[setUnfocused],
	);

	const { ref, isFocused, key, isRegistered } = useNavigatable(
		parentKey,
		index,
		move,
		undefined,
		true,
	);
	const { setFocused } = useFocusStore();

	useEffect(() => {
		if (focusOnCreate && key && isRegistered) {
			setFocused(key, MovementAction.ENTER);
		}
	}, [focusOnCreate, key, isRegistered]);

	return (
		<div
			className={cc(styles.key, isFocused && styles.focused)}
			ref={ref}
			onClick={() => move(MovementAction.ENTER)}
		>
			{letter}
		</div>
	);
}

interface Props extends IFocusableProps {}

export function OnScreenKeyboard({ parentKey, setUnfocused, index }: Props) {
	return (
		<NavList
			parentKey={parentKey}
			index={index}
			direction="vertical"
			className={styles.container}
			setUnfocused={setUnfocused}
		>
			{(props) => (
				<NavList {...props} direction="horizontal" className={styles.row}>
					{(props) => <Key {...props} letter="1" key="1" focusOnCreate />}
					{(props) => <Key {...props} letter="2" key="2" />}
					{(props) => <Key {...props} letter="3" key="3" />}
					{(props) => <Key {...props} letter="4" key="4" />}
					{(props) => <Key {...props} letter="5" key="5" />}
					{(props) => <Key {...props} letter="6" key="6" />}
					{(props) => <Key {...props} letter="7" key="7" />}
					{(props) => <Key {...props} letter="8" key="8" />}
					{(props) => <Key {...props} letter="9" key="9" />}
					{(props) => <Key {...props} letter="0" key="0" />}
				</NavList>
			)}
			{(props) => (
				<NavList {...props} direction="horizontal" className={styles.row}>
					{(props) => <Key {...props} letter="q" key="q" />}
					{(props) => <Key {...props} letter="w" key="w" />}
					{(props) => <Key {...props} letter="e" key="e" />}
					{(props) => <Key {...props} letter="r" key="r" />}
					{(props) => <Key {...props} letter="t" key="t" />}
					{(props) => <Key {...props} letter="y" key="y" />}
					{(props) => <Key {...props} letter="u" key="u" />}
					{(props) => <Key {...props} letter="i" key="i" />}
					{(props) => <Key {...props} letter="o" key="o" />}
					{(props) => <Key {...props} letter="p" key="p" />}
				</NavList>
			)}
			{(props) => (
				<NavList {...props} direction="horizontal" className={styles.row}>
					{(props) => <Key {...props} letter="a" key="a" />}
					{(props) => <Key {...props} letter="s" key="s" />}
					{(props) => <Key {...props} letter="d" key="d" />}
					{(props) => <Key {...props} letter="f" key="f" />}
					{(props) => <Key {...props} letter="g" key="g" />}
					{(props) => <Key {...props} letter="h" key="h" />}
					{(props) => <Key {...props} letter="j" key="j" />}
					{(props) => <Key {...props} letter="k" key="k" />}
					{(props) => <Key {...props} letter="l" key="l" />}
				</NavList>
			)}
			{(props) => (
				<NavList {...props} direction="horizontal" className={styles.row}>
					{(props) => <Key {...props} letter="z" key="z" />}
					{(props) => <Key {...props} letter="x" key="x" />}
					{(props) => <Key {...props} letter="c" key="c" />}
					{(props) => <Key {...props} letter="v" key="v" />}
					{(props) => <Key {...props} letter="b" key="b" />}
					{(props) => <Key {...props} letter="n" key="n" />}
					{(props) => <Key {...props} letter="m" key="m" />}
				</NavList>
			)}
		</NavList>
	);
}
