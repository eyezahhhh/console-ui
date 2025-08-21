import SunshineCodec from "../enum/sunshine-codec";

type IMoonlightHostStatus = {
	address: string;
	port: number;
} & (
	| {
			enabled: true;
			uuid: string;
			name: string;
			codecs: SunshineCodec[];
			httpsPort: number;
			type: "sunshine" | "gamestream";
	  }
	| {
			enabled: false;
	  }
);
export default IMoonlightHostStatus;
