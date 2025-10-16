import Button from "@component/button";
import NavList from "@component/nav-list";
import useMachine from "@hook/machine.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { useParams } from "react-router";
import styles from "./machine.module.scss";
import { useEffect, useMemo, useState } from "react";
import Modal from "@component/modal";
import { getGamestreamHostName } from "@util/string.util";
import AppTile from "@component/app-tile";
import { isMachineDiscovered, isMachinePaired } from "@util/object.util";
import NavGrid from "@component/nav-grid";

export function MachinePage(props: IFocusableProps) {
	const params = useParams();
	const [pin, setPin] = useState<string | null>(null);
	const machine = useMachine(params.machine || null, {
		onPin: setPin,
	});
	const isPairable = useMemo(() => {
		return !!machine?.online && (machine.isPairing || !machine.isPaired);
	}, [machine]);

	const name = useMemo(() => {
		if (!isMachineDiscovered(machine)) {
			return "Unknown Machine";
		}
		return machine.config.name || machine.config.address;
	}, [machine]);

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
				</NavList>
			)}
			{isMachineDiscovered(machine) &&
				isMachinePaired(machine) &&
				((props) =>
					machine.apps.length ? (
						<NavGrid
							{...props}
							maxColumnWidth={200}
							columnGap={20}
							className={styles.appGrid}
						>
							{machine.apps.map((app, index) => (props) => (
								<AppTile
									{...props}
									key={app.id}
									focusOnCreate={!index}
									app={app}
									machine={machine}
								/>
							))}
						</NavGrid>
					) : (
						<NavList {...props} direction="horizontal">
							<span>This machine doesn't have any apps</span>
						</NavList>
					))}
		</NavList>
	);
}
