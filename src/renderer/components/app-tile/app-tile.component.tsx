import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./app-tile.module.scss";
import Clickable from "@component/clickable";
import { useEffect, useMemo, useState } from "react";
import IDiscoveredMachine from "@interface/discovered-machine.interface";
import IMachineApp from "@interface/machine-app.interface";
import Ghost from "@component/ghost";
import { IAspectRatio } from "@interface/aspect-ratio.interface";

interface Props extends IFocusableProps {
	app: IMachineApp;
	machine: IDiscoveredMachine;
	focusOnCreate?: boolean;
	aspectRatio?: IAspectRatio;
}

export function AppTile({
	app,
	parentKey,
	index,
	setUnfocused,
	focusOnCreate,
	machine,
	aspectRatio,
}: Props) {
	const [image, setImage] = useState<string | null>(null);
	const [isDefaultImage, setIsDefaultImage] = useState(true);

	const css: Record<string, string> = useMemo(() => {
		const ar = aspectRatio ?? { x: 1, y: 1.41 };
		return {
			"--aspect-ratio": `${ar.x} / ${ar.y}`,
		};
	}, [aspectRatio?.x, aspectRatio?.y]);

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
			<div className={styles.imageContainer} style={css}>
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
