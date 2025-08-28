type ISunshineServerInfo =
	| {
			"@_status_code": "200";
			hostname: string;
			appversion: string;
			GfeVersion: string;
			uniqueid: string;
			HttpsPort: number;
			externalPort: number;
			MaxLumaPixelsHEVC: number;
			mac: string;
			localIP: string;
			ServerCodecModeSupport: number;
			SupportedDisplayMode: {
				DisplayMode: {
					Width: number;
					Height: number;
					RefreshRate: number;
				}[];
			};
			PairStatus: number;
			currentgame: number;
			state: string;
	  }
	| {
			"@_status_code": "401";
	  };
export default ISunshineServerInfo;
