import { useCallback, useMemo, useRef } from "react";
import styles from "./machine.module.scss";
import IMachine from "@interface/machine.interface";
import IFocusableProps from "@interface/focusable-props.interface";
import { useNavigate } from "react-router";
import Clickable from "@component/clickable";
import { isMachineOnline } from "@util/object.util";
import { Menu } from "@state/context-menu.store";
import useContextMenu from "@hook/context-menu.hook";

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
			</div>
		</Clickable>
	);
}
