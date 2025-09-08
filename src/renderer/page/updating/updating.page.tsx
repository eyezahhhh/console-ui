import IFocusableProps from "@interface/focusable-props.interface";
import styles from "./updating.module.scss";
import NavList from "@component/nav-list";
import useUpdate from "@hook/update.hook";
import ProgressBar from "@component/progress-bar";
import { abbreviateMeasurement } from "@util/number.util";

export function UpdatingPage(props: IFocusableProps) {
	const { downloadProgress } = useUpdate();

	return (
		<NavList {...props} direction="vertical" className={styles.container}>
			<span>Downloading update...</span>
			<ProgressBar max={100} value={downloadProgress?.percent || 0} />
			{!!downloadProgress && (
				<div className={styles.progressInfo}>
					<span>
						{abbreviateMeasurement(downloadProgress.transferred, 1)}B /{" "}
						{abbreviateMeasurement(downloadProgress.total, 1)}B
					</span>
				</div>
			)}
		</NavList>
	);
}
