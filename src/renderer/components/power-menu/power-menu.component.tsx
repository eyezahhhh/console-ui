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
					key="restart"
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
					key="quit"
				>
					Exit Console UI
				</Button>
			)}
			{(props) => (
				<Button
					{...props}
					className={styles.button}
					onEnter={() => {
						onClose?.();
						window.ipc.send("suspend");
					}}
				>
					Suspend
				</Button>
			)}
			{(props) => (
				<Button
					{...props}
					className={styles.button}
					onEnter={() => {
						window.ipc.send("reboot");
					}}
					key="reboot"
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
					key="shutdown"
				>
					Shutdown Computer
				</Button>
			)}
		</Modal>
	);
}
