import { createRoot } from "react-dom/client";
import "./global.scss";
import styles from "./index.module.scss";
import MachineList from "./components/machine-list";
import { useMemo } from "react";
import TopMenu from "./components/top-menu";
import NavList from "@component/nav-list";

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
				{(props) => <TopMenu {...props} />}
				{(props) => <MachineList {...props} />}
				{(props) => <MachineList {...props} />}
				{(props) => <MachineList {...props} />}
			</NavList>
		</div>
	);
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
