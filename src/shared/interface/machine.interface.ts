import IMoonlightHostStatus from "./moonlight-host-status.interface";
import IMoonlightHostDiskInfo from "./moonlight-host-disk-info.interface";

type IMachine = IMoonlightHostStatus & {
	config: IMoonlightHostDiskInfo;
};
export default IMachine;
