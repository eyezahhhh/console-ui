import ISettings from "@interface/settings.interface";

const DEFAULT_SETTINGS: ISettings = {
	moonlightCommand: "moonlight",
	resolution: [1280, 720],
	rotation: 0,
	fps: 60,
	bitrate: 20_000,
	packetSize: 1024,
	codec: "auto",
	hdr: false,
	remoteOptimizations: "auto",
	surroundSound: "none",
	platform: "auto",
	quitAppAfter: false,
	startFullscreen: false,
};
export default DEFAULT_SETTINGS;
