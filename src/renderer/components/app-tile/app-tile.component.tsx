import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./app-tile.module.scss";
import ISunshineApp from "@interface/sunshine-app.interface";
import IMachine from "@interface/machine.interface";
import Clickable from "@component/clickable";

interface Props extends IFocusableProps {
	app: ISunshineApp;
	machine: IMachine;
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
	return (
		<Clickable
			parentKey={parentKey}
			index={index}
			setUnfocused={setUnfocused}
			focusOnCreate={focusOnCreate}
			className={styles.container}
			focusedClassName={styles.focused}
			onEnter={() => {
				window.ipc.send("stream", machine.uuid, app.ID);
			}}
		>
			{app.AppTitle}
		</Clickable>
	);
}
