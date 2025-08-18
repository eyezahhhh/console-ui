import { createRoot } from "react-dom/client";
import "./global.scss";
import styles from "./index.module.scss";
import Machine from "@component/machine";

function App() {
	return (
		<div className={styles.container}>
			<h1>Hello!!!</h1>
			<Machine
				machine={{
					address: "192.168.68.145",
					name: "AuraSide VM",
				}}
			/>
		</div>
	);
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
