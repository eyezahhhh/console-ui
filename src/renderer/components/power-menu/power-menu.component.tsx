import Modal from "@component/modal";
import styles from "./power-menu.module.scss";
import Button from "@component/button";

interface Props {
	open: boolean;
	onClose?: () => void;
}

export function PowerMenu({ open, onClose }: Props) {
	return (
		<Modal open={open} onClose={onClose} className={styles.modal}>
			{(props) => (
				<Button
					{...props}
					className={styles.button}
					onEnter={() => {
						window.ipc.send("restart");
					}}
				>
					Restart Console UI
				</Button>
			)}
			{(props) => (
				<Button
					{...props}
					className={styles.button}
					onEnter={() => {
						window.ipc.send("quit");
					}}
				>
					Exit Console UI
				</Button>
			)}
			{(props) => (
				<Button
					{...props}
					className={styles.button}
					onEnter={() => {
						window.ipc.send("reboot");
					}}
				>
					Restart Computer
				</Button>
			)}
			{(props) => (
				<Button
					{...props}
					className={styles.button}
					onEnter={() => {
						window.ipc.send("shutdown");
					}}
				>
					Shutdown Computer
				</Button>
			)}
		</Modal>
	);
}
