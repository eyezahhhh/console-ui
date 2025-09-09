import { useCallback, useMemo, useRef } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";
import IFocusableProps from "@interface/focusable-props.interface";
import { useNavigate } from "react-router";
import Clickable from "@component/clickable";
import { isMachineOnline } from "@util/object.util";
import { Menu } from "@state/context-menu.store";
import useContextMenu from "@hook/context-menu.hook";
import SearchIcon from "@mui/icons-material/Search";
import SignalWifi0BarIcon from "@mui/icons-material/SignalWifi0Bar";
import PendingIcon from "@mui/icons-material/Pending";
import LockIcon from "@mui/icons-material/Lock";

interface Props extends IFocusableProps {
	machine?: IMachine;
}

export function Machine({ machine, parentKey, setUnfocused, index }: Props) {
	const navigate = useNavigate();
	const ref = useRef<HTMLDivElement>(null);

	const openMenu = useContextMenu(
		useCallback(
			(key) => ({
				ref: ref.current!,
				key,
				options: {
					delete: "Delete Machine",
				},
				onSelect: (option) => {
					switch (option) {
						case "delete":
							if (machine) {
								console.log("Deleting machine");
								window.ipc.send("delete_machine", machine);
							}

							break;
					}
				},
			}),
			[machine],
		) as (key: {}) => Menu<Record<string, string>>,
	);

	const uuid = useMemo(() => {
		return (machine?.config.discovered && machine.config.uuid) || null;
	}, [machine]);

	const name = useMemo(() => {
		if (machine?.config.discovered) {
			return machine.config.name;
		}
		return machine?.config.address || "Unknown Machine";
	}, [machine]);

	const Icon = useMemo(() => {
		if (!machine) {
			return null;
		}
		if (!machine.config.discovered) {
			return SearchIcon;
		}
		if (!machine.online) {
			return SignalWifi0BarIcon;
		}
		if (machine.isPairing) {
			return PendingIcon;
		}
		if (!machine.isPaired) {
			return LockIcon;
		}
		return null;
	}, [machine]);

	return (
		<Clickable
			parentKey={parentKey}
			setUnfocused={setUnfocused}
			index={index}
			className={styles.container}
			focusedClassName={styles.focused}
			onEnter={
				isMachineOnline(machine || null) && (() => navigate(`/machine/${uuid}`))
			}
			onOptions={openMenu}
		>
			<div className={styles.content} ref={ref}>
				<span className={styles.title}>{name}</span>

				{Icon && (
					<div className={styles.iconContainer}>
						<Icon className={styles.icon} />
					</div>
				)}
			</div>
		</Clickable>
	);
}
