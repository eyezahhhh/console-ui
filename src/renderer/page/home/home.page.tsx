import Button from "@component/button";
import MachineGrid from "@component/machine-grid";
import Modal from "@component/modal";
import NavList from "@component/nav-list";
import TextInput from "@component/text-input";
import IFocusableProps from "@interface/focusable-props.interface";
import { useEffect, useState } from "react";
import styles from "./home.module.scss";

export function HomePage(props: IFocusableProps) {
	const [createOpen, setCreateOpen] = useState(false);
	const [createInput, setCreateInput] = useState("");

	useEffect(() => {
		setCreateInput("");
	}, [createOpen]);

	return (
		<NavList {...props} direction="vertical">
			<Modal open={createOpen} onClose={() => setCreateOpen(false)}>
				{(props) => (
					<TextInput
						{...props}
						value={createInput}
						onChange={setCreateInput}
						keymap="ip_address"
					/>
				)}
				{(props) => (
					<Button
						{...props}
						onEnter={() => {
							if (!createInput) {
								return;
							}
							console.log("Creating new machine!", createInput);
							window.ipc.invoke("create_machine", createInput).finally(() => {
								setCreateOpen(false);
							});
						}}
					>
						Create
					</Button>
				)}
			</Modal>
			{(props) => <MachineGrid {...props} />}
			{(props) => (
				<Button
					{...props}
					onEnter={() => setCreateOpen(true)}
					className={styles.createButton}
				>
					New Machine
				</Button>
			)}
		</NavList>
	);
}
