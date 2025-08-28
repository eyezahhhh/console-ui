import { createRoot } from "react-dom/client";
import "./global.scss";
import styles from "./index.module.scss";
import { StrictMode, useMemo } from "react";
import TopMenu from "./components/top-menu";
import NavList from "@component/nav-list";
import { HashRouter } from "react-router";
import PageRouter from "@component/page-router";
import HomePage from "./page/home";
import MachinePage from "./page/machine";
import SettingsPage from "./page/settings";

function App() {
	const key = useMemo(() => ({}), []);

	return (
		<div className={styles.container}>
			<NavList
				parentKey={key}
				setUnfocused={() => {
					console.log("Unfocus event propagated all the way to App component");
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
