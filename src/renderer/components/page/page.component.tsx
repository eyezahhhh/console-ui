import useNavigatable from "@hook/navigatable.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import OptionalArray from "@interface/optional-array.interface";
import useFocusStore from "@state/focus.store";
import { Route } from "react-router";

interface Props extends IFocusableProps {
	route: string;
	children: (props: IFocusableProps) => React.JSX.Element;
}

export function Page({
	route,
	children,
	index,
	setUnfocused,
	parentKey,
}: Props) {
	const { ref, key } = useNavigatable(
		parentKey,
		index,
		(action) => {
			console.log("PAGE", action);
		},
		(lastComponent) => {},
	);

	const { setFocusedFromParent, getChildrenOf } = useFocusStore();

	return (
		<Route
			path={route}
			element={
				<div>
					{children({
						index: 0,
						setUnfocused,
						parentKey,
					})}
				</div>
			}
		/>
	);
}
