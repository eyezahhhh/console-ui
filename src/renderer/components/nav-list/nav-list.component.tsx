import { toArray } from "@util/array.util";
import IFocusableProps from "@interface/focusable-props.interface";
import OptionalArray from "@interface/optional-array.interface";
import useNavigatable from "@hook/navigatable.hook";
import MovementAction from "@enum/movement-action.enum";
import useFocusStore from "@state/focus.store";
import { CSSProperties } from "react";

interface Props extends IFocusableProps {
	direction: "horizontal" | "vertical";
	children?: OptionalArray<
		false | React.JSX.Element | ((props: IFocusableProps) => React.JSX.Element)
	>;
	className?: string;
	style?: CSSProperties;
}

export function NavList({
	direction,
	children,
	className,
	setUnfocused,
	index,
	parentKey,
	style,
}: Props) {
	const { setFocusedFromParent } = useFocusStore();

	const { ref, key } = useNavigatable(
		parentKey,
		index,
		(action) => {
			console.log("NAVLIST", action);
		},
		{
			focusable: false,
		},
	);

	let childIndexCounter = 0;
	const mappedChildren = toArray(children || []).map((child) => {
		if (typeof child != "function") {
			return child;
		}

		const functionalChildrenCount = toArray(children || []).filter(
			(child) => typeof child == "function",
		).length;
		const childIndex = childIndexCounter++;
		return child({
			parentKey: key,
			index: childIndex,
			setUnfocused: (action) => {
				let increment: number | null = null;
				if (direction == "horizontal") {
					if (action == MovementAction.LEFT) {
						increment = -1;
					}
					if (action == MovementAction.RIGHT) {
						increment = 1;
					}
				} else {
					if (action == MovementAction.UP) {
						increment = -1;
					}
					if (action == MovementAction.DOWN) {
						increment = 1;
					}
				}
				if (!increment) {
					setUnfocused(action);
					return;
				}

				for (let index = childIndex + increment; true; index += increment) {
					if (index < 0 || index >= functionalChildrenCount) {
						setUnfocused(action);
						return;
					}

					if (setFocusedFromParent(key, index, action)) {
						return;
					}
				}
			},
		});
	});

	return (
		<div className={className} ref={ref} style={style}>
			{mappedChildren}
		</div>
	);
}
