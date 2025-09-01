import Modal from "@component/modal";
import ProgressBar from "@component/progress-bar";
import useUpdate from "@hook/update.hook";

export function DownloadModal() {
	const { isDownloading, downloadProgress } = useUpdate();

	return (
		<Modal open={isDownloading}>
			<span>Downloading update...</span>
			<ProgressBar max={100} value={downloadProgress?.percent || 0} />
		</Modal>
	);
}
