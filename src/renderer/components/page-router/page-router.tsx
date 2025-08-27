import IFocusableProps from "@interface/focusable-props.interface";
import { Route, Routes } from "react-router";

interface Props extends IFocusableProps {
	routes: Record<string, (props: IFocusableProps) => React.JSX.Element>;
}

export function PageRouter({ setUnfocused, parentKey, index, routes }: Props) {
	return (
		<Routes>
			{Object.entries(routes).map(([path, component]) => (
				<Route
					path={path}
					element={component({
						setUnfocused,
						parentKey,
						index,
					})}
				/>
			))}
		</Routes>
	);
}
