import { toArray } from "@util/array.util";
import IFocusableProps from "@interface/focusable-props.interface";
import OptionalArray from "@interface/optional-array.interface";
import useNavigatable from "@hook/navigatable.hook";
import MovementAction from "@enum/movement-action.enum";
import { useMemo } from "react";
import useFocusStore from "@state/focus.store";

interface Props extends IFocusableProps {
	direction: "horizontal" | "vertical";
	children: OptionalArray<(props: IFocusableProps) => React.JSX.Element>;
	className?: string;
}

export function NavList({
	direction,
	children,
	className,
	setUnfocused,
	index,
	parentKey,
}: Props) {
	const { ref, key } = useNavigatable(
		parentKey,
		index,
		(action) => {
			console.log("NAVLIST", action);
		},
		(lastComponent) => {
			const lastRef = lastComponent?.ref;
			if (!lastRef) {
				// don't know what the last component was, select first component as fallback
				setFocusedFromParent(key, 0);
				return;
			}

			const children = getChildrenOf(key);

			if (!children) {
				// todo: implement
				console.error("Nav list has no children! Don't know what to do");
				return;
			}

			console.log("My children:", children);

			const getCenter = (rect: DOMRect) => {
				return {
					x: rect.x + rect.width / 2,
					y: rect.y + rect.height / 2,
				};
			};

			const lastCenter = getCenter(lastRef.getBoundingClientRect());
			console.log(lastCenter);

			const childrenCenters = children.map((child) => {
				const center = getCenter(child.ref.getBoundingClientRect());
				const xDistance = Math.abs(center.x - lastCenter.x);
				const yDistance = Math.abs(center.y - lastCenter.y);
				return {
					child,
					distance: xDistance + yDistance,
				};
			});
			childrenCenters.sort((a, b) => a.distance - b.distance);
			console.log(childrenCenters);
			setFocusedFromParent(key, childrenCenters[0].child.index);
		},
	);
	const { setFocusedFromParent, getChildrenOf } = useFocusStore();

	const mappedChildren = useMemo(() => {
		return toArray(children).map((child, index) => {
			return child({
				parentKey: key,
				index,
				setUnfocused: (action) => {
					if (direction == "horizontal") {
						if (action == MovementAction.LEFT && index > 0) {
							setFocusedFromParent(key, index - 1);
						} else if (
							action == MovementAction.RIGHT &&
							index < mappedChildren.length - 1
						) {
							setFocusedFromParent(key, index + 1);
						} else {
							setUnfocused(action);
						}
					} else {
						console.log("VERTICAL MOVE", action, index);
						if (action == MovementAction.UP && index > 0) {
							setFocusedFromParent(key, index - 1);
						} else if (
							action == MovementAction.DOWN &&
							index < mappedChildren.length - 1
						) {
							setFocusedFromParent(key, index + 1);
						} else {
							setUnfocused(action);
						}
					}
				},
			});
		});
	}, [children]);

	return (
		<div className={className} ref={ref}>
			{mappedChildren}
		</div>
	);
}
