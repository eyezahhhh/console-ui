import MoonlightCodec from "@type/moonlight-codec.type";

export default interface ISettings {
	moonlightCommand: string;
	resolution: [number, number];
	rotation: 0 | 90 | 180 | 270;
	fps: number;
	bitrate: number; // Kbps
	packetSize: number; // bytes
	codec: MoonlightCodec;
	hdr: boolean;
	remoteOptimizations: boolean | "auto";
	surroundSound: "none" | "5.1" | "7.1";
	platform: MoonlightPlatform;
	quitAppAfter: boolean;
}
