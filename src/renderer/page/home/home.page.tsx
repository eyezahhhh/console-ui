import Button from "@component/button";
import MachineList from "@component/machine-list";
import Modal from "@component/modal";
import NavList from "@component/nav-list";
import TextInput from "@component/text-input";
import IFocusableProps from "@interface/focusable-props.interface";
import { useEffect, useState } from "react";

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
			{(props) => <MachineList {...props} />}
			{(props) => (
				<Button {...props} onEnter={() => setCreateOpen(true)}>
					New Machine
				</Button>
			)}
		</NavList>
	);
}
