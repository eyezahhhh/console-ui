import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./app-tile.module.scss";
import Clickable from "@component/clickable";
import { useEffect, useState } from "react";
import IDiscoveredMachine from "@interface/discovered-machine.interface";
import IMachineApp from "@interface/machine-app.interface";
import Ghost from "@/ghost";

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
	const [image, setImage] = useState<string | null>(null);
	const [isDefaultImage, setIsDefaultImage] = useState(true);

	useEffect(() => {
		let active = true;
		setImage(null);
		window.ipc.invoke("get_app_image", machine, app.id).then((data) => {
			if (data) {
				const [image, isDefault] = data;
				setImage(image);
				setIsDefaultImage(isDefault);
			}
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
			<div className={styles.imageContainer}>
				{image ? (
					<>
						<img src={image} className={styles.background} />
						{isDefaultImage && (
							<span className={styles.defaultTitle}>{app.name}</span>
						)}
					</>
				) : (
					<Ghost className={styles.loading} />
				)}
			</div>
			{!isDefaultImage && <span className={styles.lowerTitle}>{app.name}</span>}
		</Clickable>
	);
}
