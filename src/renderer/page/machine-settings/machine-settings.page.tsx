import NavList from "@component/nav-list";
import ResolutionInput from "@component/resolution-input";
import useMachine from "@hook/machine.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { isMachineDiscovered } from "@util/object.util";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import styles from "../settings/settings.module.scss";
import { IAspectRatio } from "@interface/aspect-ratio.interface";
import Button from "@component/button";
import AppTileSize from "@enum/app-tile-size.enum";
import { Dropdown } from "@component/dropdown/dropdown.component";

export function MachineSettingsPage(props: IFocusableProps) {
	const params = useParams();
	const navigate = useNavigate();
	const machine = useMachine(params.machine || null);
	const [isSaving, setIsSaving] = useState(false);

	const [appTileAspectRatio, setAppTileAspectRatio] = useState<IAspectRatio>({
		x: 0,
		y: 0,
	});
	const [appTileSize, setAppTileSize] = useState<AppTileSize>(
		AppTileSize.NORMAL,
	);

	const name = useMemo(() => {
		if (!isMachineDiscovered(machine)) {
			return "Unknown Machine";
		}
		return machine.config.name || machine.config.address;
	}, [machine]);

	useEffect(() => {
		if (!machine?.config.discovered) {
			return;
		}
		const settings = machine.config.settings;
		setAppTileAspectRatio(settings.appTileAspectRatio || { x: 1, y: 1.41 });
		setAppTileSize(settings.appTileSize || AppTileSize.NORMAL);
	}, [machine]);

	if (!machine) {
		return <h1>Machine Disconnected</h1>;
	}

	return (
		<div className={styles.container}>
			<h1>{name} settings</h1>
			<NavList {...props} direction="vertical">
				<span className={styles.label}>App tile aspect ratio</span>
				{(props) => (
					<ResolutionInput
						{...props}
						resolution={[appTileAspectRatio.x, appTileAspectRatio.y]}
						onChange={([x, y]) => setAppTileAspectRatio({ x, y })}
						allowDecimal
					/>
				)}
				<span className={styles.label}>App tile size</span>
				{(props) => (
					<Dropdown
						{...props}
						options={["Small", "Normal", "Large", "Extra large"]}
						selectedIndex={Object.values(AppTileSize).indexOf(appTileSize)}
						onSelect={(index) =>
							setAppTileSize(Object.values(AppTileSize)[index])
						}
					/>
				)}
				{(props) => (
					<Button
						{...props}
						onEnter={() => {
							if (isSaving || !machine.config.discovered) {
								return;
							}
							setIsSaving(true);

							window.ipc
								.invoke("save_machine_settings", machine.config.uuid, {
									appTileAspectRatio,
									appTileSize,
								})
								.catch(console.error)
								.finally(() => {
									setIsSaving(false);
								});
						}}
					>
						{isSaving ? "Saving" : "Save"}
					</Button>
				)}
			</NavList>
		</div>
	);
}
