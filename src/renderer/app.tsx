import { createRoot } from "react-dom/client";
import "./global.scss";
import styles from "./index.module.scss";
import { StrictMode, useMemo } from "react";
import TopMenu from "./components/top-menu";
import NavList from "@component/nav-list";
import { HashRouter, useNavigate } from "react-router";
import PageRouter from "@component/page-router";
import HomePage from "./page/home";
import MachinePage from "./page/machine";
import SettingsPage from "./page/settings";
import GamepadDebugPage from "./page/gamepad-debug";
import MovementAction from "@enum/movement-action.enum";

function App() {
	const key = useMemo(() => ({}), []);
	const navigate = useNavigate();

	return (
		<div className={styles.container}>
			<NavList
				parentKey={key}
				setUnfocused={(action) => {
					if (action == MovementAction.BACK) {
						// navigate(-1);
						// todo: after navigating, focus a component
					} else {
						console.log(
							"Unfocus event propagated all the way to App component",
						);
					}
				}}
				index={0}
				direction="vertical"
			>
				{(props) => <TopMenu {...props} key="top" />}
				{(props) => (
					<PageRouter
						{...props}
						routes={{
							"/": (props) => <HomePage {...props} />,
							"machine/:machine": (props) => <MachinePage {...props} />,
							settings: (props) => <SettingsPage {...props} />,
							"gamepad-debug": (props) => <GamepadDebugPage {...props} />,
						}}
					/>
				)}
			</NavList>
		</div>
	);
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
	<StrictMode>
		<HashRouter>
			<App />
		</HashRouter>
	</StrictMode>,
);
