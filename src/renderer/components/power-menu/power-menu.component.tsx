import Modal from "@component/modal";
import styles from "./power-menu.module.scss";
import Button from "@component/button";

interface Props {
	open: boolean;
	onClose?: () => void;
}

export function PowerMenu({ open, onClose }: Props) {
	return (
		<Modal open={open} onClose={onClose}>
			{(props) => (
				<Button
					{...props}
					onEnter={() => {
						window.ipc.send("quit");
					}}
				>
					Exit Console UI
				</Button>
			)}
		</Modal>
	);
}
