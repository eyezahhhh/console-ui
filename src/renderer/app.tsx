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
import ContextMenu from "@component/context-menu";
import useUpdate from "@hook/update.hook";
import UpdatingPage from "./page/updating";

function App() {
	const key = useMemo(() => ({}), []);
	const navigate = useNavigate();
	const { isDownloading } = useUpdate();

	return (
		<div className={styles.container}>
			<ContextMenu />
			<NavList
				parentKey={key}
				setUnfocused={(action) => {
					if (!isDownloading) {
						console.log(
							"Unfocus event propagated all the way to App component",
						);
					}
				}}
				index={0}
				direction="vertical"
			>
				{(props) => <TopMenu {...props} key="top" />}
				{isDownloading
					? (props) => <UpdatingPage {...props} key="updating" />
					: (props) => (
							<PageRouter
								key="router"
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
