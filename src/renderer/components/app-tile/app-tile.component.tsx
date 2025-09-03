import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./app-tile.module.scss";
import ISunshineApp from "@interface/sunshine-app.interface";
import Clickable from "@component/clickable";
import { useEffect } from "react";
import IDiscoveredMachine from "@interface/discovered-machine.interface";

interface Props extends IFocusableProps {
	app: ISunshineApp;
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
		console.log("App ID:", app.ID);
		let active = true;
		window.ipc.invoke("get_app_image", machine, app.ID).then((data) => {
			console.log("App image response:", data);
		});

		return () => {
			active = false;
		};
	}, [app.ID, machine]);

	return (
		<Clickable
			parentKey={parentKey}
			index={index}
			setUnfocused={setUnfocused}
			focusOnCreate={focusOnCreate}
			className={styles.container}
			focusedClassName={styles.focused}
			onEnter={() => {
				window.ipc.send("stream", machine.config.uuid, app.ID);
			}}
		>
			{app.AppTitle}
		</Clickable>
	);
}
