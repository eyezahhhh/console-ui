import { toArray } from "@util/array.util";
import IFocusableProps from "@interface/focusable-props.interface";
import OptionalArray from "@interface/optional-array.interface";
import useNavigatable from "@hook/navigatable.hook";
import MovementAction from "@enum/movement-action.enum";
import { useEffect, useMemo } from "react";
import useFocusStore from "@state/focus.store";

interface Props extends IFocusableProps {
	direction: "horizontal" | "vertical";
	children?: OptionalArray<
		false | React.JSX.Element | ((props: IFocusableProps) => React.JSX.Element)
	>;
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
		(lastComponent, action) => {
			const lastRef = lastComponent?.ref;
			if (!lastRef) {
				// don't know what the last component was, select first component as fallback
				setFocusedFromParent(key, 0, action);
				return;
			}

			const children = getChildrenOf(key);

			if (!children) {
				// todo: implement
				console.error("Nav list has no children! Don't know what to do");
				return;
			}

			const getCenter = (rect: DOMRect) => {
				return {
					x: rect.x + rect.width / 2,
					y: rect.y + rect.height / 2,
				};
			};

			const lastCenter = getCenter(lastRef.getBoundingClientRect());

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
			if (childrenCenters.length) {
				setFocusedFromParent(key, childrenCenters[0].child.index, action);
			} else {
				setUnfocused(action);
			}
		},
	);
	const { setFocusedFromParent, getChildrenOf } = useFocusStore();

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
				if (direction == "horizontal") {
					if (action == MovementAction.LEFT && childIndex > 0) {
						setFocusedFromParent(key, childIndex - 1, action);
					} else if (
						action == MovementAction.RIGHT &&
						childIndex < functionalChildrenCount - 1
					) {
						setFocusedFromParent(key, childIndex + 1, action);
					} else {
						setUnfocused(action);
					}
				} else {
					if (action == MovementAction.UP && childIndex > 0) {
						setFocusedFromParent(key, childIndex - 1, action);
					} else if (
						action == MovementAction.DOWN &&
						childIndex < functionalChildrenCount - 1
					) {
						setFocusedFromParent(key, childIndex + 1, action);
					} else {
						setUnfocused(action);
					}
				}
			},
		});
	});

	return (
		<div className={className} ref={ref}>
			{mappedChildren}
		</div>
	);
}
