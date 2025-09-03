import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./app-tile.module.scss";
import Clickable from "@component/clickable";
import { useEffect } from "react";
import IDiscoveredMachine from "@interface/discovered-machine.interface";
import IMachineApp from "@interface/machine-app.interface";

interface Props extends IFocusableProps {
	app: IMachineApp;
	machine: IDiscoveredMachine;
	focusOnCreate?: boolean;
}

export function AppTile({
	app,
	parentKey,
	index,
	setUnfocused,
	focusOnCreate,
	machine,
}: Props) {
	console.log({ app });

	useEffect(() => {
		console.log("App ID:", app.id);
		let active = true;
		window.ipc.invoke("get_app_image", machine, app.id).then((data) => {
			console.log("App image response:", data);
		});

		return () => {
			active = false;
		};
	}, [app.id, machine]);

	return (
		<Clickable
			parentKey={parentKey}
			index={index}
			setUnfocused={setUnfocused}
			focusOnCreate={focusOnCreate}
			className={styles.container}
			focusedClassName={styles.focused}
			onEnter={() => {
				window.ipc.send("stream", machine.config.uuid, app.id);
			}}
		>
			{app.name}
		</Clickable>
	);
}
