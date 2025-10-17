import MoonlightHostType from "@type/moonlight-host-type.type";
import IMachineSettings from "./machine-settings.interface";

type IMoonlightHostDiskInfo = {
	readonly address: string;
	readonly port: number;
} & (
	| {
			discovered: false;
	  }
	| {
			discovered: true;
			uuid: string;
			name: string;
			type: MoonlightHostType;
			appVersion: string;
			serverCert: string | null;
			settings: IMachineSettings;
	  }
);
export default IMoonlightHostDiskInfo;
