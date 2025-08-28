import Button from "@component/button";
import NavList from "@component/nav-list";
import useMachine from "@hook/machine.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { useParams } from "react-router";
import styles from "./machine.module.scss";
import { useEffect, useMemo, useState } from "react";
import Modal from "@component/modal";
import { getGamestreamHostName } from "@util/string.util";
import MachineState from "@enum/machine-state.enum";
import AppTile from "@component/app-tile";

export function MachinePage(props: IFocusableProps) {
	const params = useParams();
	const [pin, setPin] = useState<string | null>(null);
	const machine = useMachine(params.machine || null, {
		onPin: setPin,
	});
	const isPairable = useMemo(() => {
		return (
			MachineState.PAIRING == machine?.state ||
			MachineState.UNPAIRED == machine?.state
		);
	}, [machine]);

	const name = useMemo(() => {
		if (!machine) {
			return "Unknown Machine";
		}
		return machine.name || machine.address;
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
					{getGamestreamHostName(machine?.type || null)}
				</span>
				{(props) => (
					<Button {...props} onEnter={() => setPin(null)}>
						Close
					</Button>
				)}
			</Modal>
			<div className={styles.top}>
				<span className={styles.title}>{`${name} - ${machine?.state}`}</span>
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
									if (!machine) {
										return;
									}
									window.ipc.send("pair", machine.uuid);
								}}
							>
								Connect
							</Button>
						))}
				</NavList>
			)}
			{!!machine &&
				((props) => (
					<NavList {...props} direction="horizontal" className={styles.appList}>
						{machine.apps.length ? (
							machine.apps.map((app, index) => (props) => (
								<AppTile
									{...props}
									key={app.ID}
									focusOnCreate={!index}
									app={app}
									machine={machine}
								/>
							))
						) : (
							<span>This machine doesn't have any apps</span>
						)}
					</NavList>
				))}
		</NavList>
	);
}
