export default interface ISunshineServerInfo {
	hostname: string;
	appversion: string;
	Gfeversion: string;
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
