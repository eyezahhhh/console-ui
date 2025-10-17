import Button from "@component/button";
import NavList from "@component/nav-list";
import useMachine from "@hook/machine.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { useNavigate, useParams } from "react-router";
import styles from "./machine.module.scss";
import { useEffect, useMemo, useState } from "react";
import Modal from "@component/modal";
import { getGamestreamHostName } from "@util/string.util";
import AppTile from "@component/app-tile";
import { isMachineDiscovered, isMachinePaired } from "@util/object.util";
import NavGrid from "@component/nav-grid";

export function MachinePage(props: IFocusableProps) {
	const params = useParams();
	const navigate = useNavigate();
	const [pin, setPin] = useState<string | null>(null);
	const machine = useMachine(params.machine || null, {
		onPin: setPin,
	});
	const isPairable = useMemo(() => {
		return !!machine?.online && (machine.isPairing || !machine.isPaired);
	}, [machine]);

	const isPaired = useMemo(() => {
		return !!machine?.online && machine.isPaired;
	}, [machine]);

	const name = useMemo(() => {
		if (!isMachineDiscovered(machine)) {
			return "Unknown Machine";
		}
		return machine.config.name || machine.config.address;
	}, [machine]);

	const appTiles = useMemo(() => {
		if (
			!machine?.online ||
			!machine.isPaired ||
			!isMachineDiscovered(machine)
		) {
			return [];
		}
		return machine.apps.map((app, index) => (props: IFocusableProps) => (
			<AppTile
				{...props}
				key={app.id}
				focusOnCreate={!index}
				app={app}
				machine={machine}
				aspectRatio={machine.config.settings.appTileAspectRatio}
			/>
		));
	}, [!!machine?.online && machine.isPaired && machine.apps]);

	const appTileSize = useMemo(() => {
		const multiplier = 200;

		if (!machine?.config.discovered || !machine.config.settings.appTileSize) {
			return multiplier;
		}
		const size = Number(machine.config.settings.appTileSize);
		return size * multiplier;
	}, [machine?.config.discovered && machine.config.settings.appTileSize]);

	useEffect(() => {
		if (!isPairable) {
			setPin(null);
		}
	}, [isPairable, pin]);

	return (
		<NavList direction="vertical" {...props}>
			<Modal open={!!machine && !!pin} onClose={() => setPin(null)}>
				<span className={styles.pinMessage}>
					Enter pin <b>{pin}</b> in{" "}
					{getGamestreamHostName(
						(machine?.config.discovered && machine.config.type) || null,
					)}
				</span>
				{(props) => (
					<Button {...props} onEnter={() => setPin(null)}>
						Close
					</Button>
				)}
			</Modal>
			<div className={styles.top}>
				<span className={styles.title}>{`${name}`}</span>
			</div>
			{(props) => (
				<NavList {...props} direction="horizontal" className={styles.buttonRow}>
					{isPairable &&
						((props) => (
							<Button
								{...props}
								className={styles.connectButton}
								focusedClassName={styles.focused}
								focusOnCreate
								onEnter={() => {
									if (!isMachineDiscovered(machine)) {
										return;
									}
									window.ipc.send("pair", machine.config.uuid);
								}}
							>
								Connect
							</Button>
						))}
					{isPaired &&
						((props) => (
							<Button
								{...props}
								className={styles.settingsButton}
								focusedClassName={styles.focused}
								onEnter={() => {
									if (machine?.config.discovered) {
										navigate(`/machine/${machine.config.uuid}/settings`);
									}
								}}
							>
								Settings
							</Button>
						))}
				</NavList>
			)}
			{isMachineDiscovered(machine) &&
				isMachinePaired(machine) &&
				((props) =>
					machine.apps.length ? (
						<NavGrid
							{...props}
							maxColumnWidth={appTileSize}
							columnGap={20}
							rowContainerClassName={styles.appGrid}
						>
							{appTiles}
						</NavGrid>
					) : (
						<NavList {...props} direction="horizontal">
							<span>This machine doesn't have any apps</span>
						</NavList>
					))}
		</NavList>
	);
}
