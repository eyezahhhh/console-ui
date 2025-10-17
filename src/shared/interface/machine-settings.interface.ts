import AppTileSize from "@enum/app-tile-size.enum";
import { IAspectRatio } from "./aspect-ratio.interface";

export default interface IMachineSettings {
	appTileAspectRatio?: IAspectRatio;
	appTileSize?: AppTileSize;
}
