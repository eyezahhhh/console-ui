import IFocusableProps from "@interface/focusable-props.interface";
import { Route, Routes } from "react-router";
import styles from "./page-router.module.scss";

interface Props extends IFocusableProps {
	routes: Record<string, (props: IFocusableProps) => React.JSX.Element>;
}

export function PageRouter({ setUnfocused, parentKey, index, routes }: Props) {
	return (
		<Routes>
			{Object.entries(routes).map(([path, component]) => (
				<Route
					path={path}
					element={
						<div className={styles.page} key={path}>
							{component({
								setUnfocused,
								parentKey,
								index,
							})}
						</div>
					}
				/>
			))}
		</Routes>
	);
}
