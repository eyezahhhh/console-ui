import SunshineCodec from "../enum/sunshine-codec";
import ISunshineApp from "./sunshine-app.interface";

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
					apps: ISunshineApp[];
			  }
	  ));
export default IMoonlightHostStatus;
