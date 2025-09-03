import SunshineCodec from "../enum/sunshine-codec";
import IMachineApp from "./machine-app.interface";

type IMoonlightHostStatus =
	| {
			online: false;
	  }
	| ({
			online: true;
			codecs: SunshineCodec[];
			isPairing: boolean;
	  } & (
			| {
					isPaired: false;
			  }
			| {
					isPaired: true;
					apps: IMachineApp[];
			  }
	  ));
export default IMoonlightHostStatus;
