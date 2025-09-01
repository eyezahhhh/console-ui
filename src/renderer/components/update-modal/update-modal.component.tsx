import Button from "@component/button";
import Modal from "@component/modal";
import useUpdate from "@hook/update.hook";
import styles from "./update-modal.module.scss";

interface Props {
	open: boolean;
	onClose?: () => void;
}

export function UpdateModal({ open, onClose }: Props) {
	const { availableUpdate, isChecking } = useUpdate();

	return (
		<Modal open={open} onClose={onClose} className={styles.modal}>
			{availableUpdate ? (
				<div>
					<span>{availableUpdate.version} is ready to download</span>
				</div>
			) : (
				<div>
					<span>
						{isChecking ? "Checking for updates..." : "Already up to date"}
					</span>
				</div>
			)}
			{availableUpdate
				? (props) => (
						<Button {...props} onEnter={() => window.ipc.send("start_update")}>
							Download Update
						</Button>
					)
				: (props) => (
						<Button
							{...props}
							disabled={isChecking}
							onEnter={() => window.ipc.send("check_updates")}
						>
							Check for updates
						</Button>
					)}
		</Modal>
	);
}
