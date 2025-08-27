import Button from "@component/button";
import NavList from "@component/nav-list";
import useMachine from "@hook/machine.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { useParams } from "react-router";
import styles from "./machine.module.scss";
import { useMemo, useState } from "react";
import Modal from "@component/modal";
import { getGamestreamHostName } from "@util/string.util";

export function MachinePage(props: IFocusableProps) {
	const params = useParams();
	const [pin, setPin] = useState<string | null>(null);
	const machine = useMachine(params.machine || null, {
		onPin: setPin,
	});

	const name = useMemo(() => {
		if (!machine) {
			return "Unknown Machine";
		}
		return machine.name || machine.address;
	}, [machine]);

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
					{(props) => (
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
					)}
				</NavList>
			)}
		</NavList>
	);
}
