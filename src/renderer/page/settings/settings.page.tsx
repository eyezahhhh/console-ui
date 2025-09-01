import { Dropdown } from "@component/dropdown/dropdown.component";
import NavList from "@component/nav-list";
import ResolutionInput from "@component/resolution-input";
import TextInput from "@component/text-input";
import { Toggle } from "@component/toggle/toggle.component";
import useSettings from "@hook/settings.hook";
import IFocusableProps from "@interface/focusable-props.interface";
import { useEffect, useState } from "react";
import MOONLIGHT_CODECS from "@const/moonlight-codecs.const";
import MOONLIGHT_PLATFORMS from "@const/moonlight-platforms.const";
import ISettings from "@interface/settings.interface";
import styles from "./settings.module.scss";
import Button from "@component/button";
import { useNavigate } from "react-router";
import useUpdate from "@hook/update.hook";
import useAppVersion from "@hook/app-version.hook";

export function SettingsPage(props: IFocusableProps) {
	const settings = useSettings();
	const navigate = useNavigate();
	const { isChecking: isUpdateChecking } = useUpdate();
	const [isSaving, setIsSaving] = useState(false);
	const appVersion = useAppVersion();

	const [moonlightCommand, setMoonlightCommand] = useState(
		settings.moonlightCommand,
	);
	const [resolution, setResolution] = useState(settings.resolution);
	const [rotation, setRotation] = useState(settings.rotation);
	const [fps, setFps] = useState(settings.fps);
	const [bitrate, setBitrate] = useState(settings.bitrate);
	const [packetSize, setPacketSize] = useState(settings.packetSize);
	const [codec, setCodec] = useState(settings.codec);
	const [hdr, setHdr] = useState(settings.hdr);
	const [remoteOptimizations, setRemoteOptimizations] = useState(
		settings.remoteOptimizations,
	);
	const [surroundSound, setSurroundSound] = useState(settings.surroundSound);
	const [platform, setPlatform] = useState(settings.platform);
	const [quitAppAfter, setQuitAppAfter] = useState(settings.quitAppAfter);
	const [kioskMode, setKioskMode] = useState(settings.kioskMode);
	const [startFullscreen, setStartFullscreen] = useState(
		settings.startFullscreen,
	);

	useEffect(() => {
		console.log("Settings changed:", settings);
		setMoonlightCommand(settings.moonlightCommand);
		setResolution(settings.resolution);
		setRotation(settings.rotation);
		setFps(settings.fps);
		setBitrate(settings.bitrate);
		setPacketSize(settings.packetSize);
		setCodec(settings.codec);
		setHdr(settings.hdr);
		setRemoteOptimizations(settings.remoteOptimizations);
		setSurroundSound(settings.surroundSound);
		setPlatform(settings.platform);
		setQuitAppAfter(settings.quitAppAfter);
		setKioskMode(settings.kioskMode);
	}, [settings]);

	const changeIfInt = (
		value: string,
		greaterThan0: boolean,
		callback: (value: number) => void,
	) => {
		if (!value.length) {
			value = "0";
		}
		const int = parseInt(value);
		if (isNaN(int)) {
			return;
		}

		if (greaterThan0 && int <= 0) {
			return;
		}
		if (int > 1_000_000_000) {
			return;
		}
		callback(int);
	};

	return (
		<NavList {...props} direction="vertical" className={styles.container}>
			<span className={styles.version}>Console UI {appVersion}</span>
			{(props) => (
				<Button
					{...props}
					onEnter={() => window.ipc.send("check_updates")}
					disabled={isUpdateChecking}
				>
					Check for updates
				</Button>
			)}
			{(props) => (
				<Button {...props} onEnter={() => navigate("/gamepad-debug")}>
					Debug Gamepads
				</Button>
			)}

			<span className={styles.label}>Moonlight-Embedded command</span>
			{(props) => (
				<TextInput
					{...props}
					value={moonlightCommand}
					onChange={setMoonlightCommand}
					placeholder="moonlight"
				/>
			)}
			<span className={styles.label}>Resolution</span>
			{(props) => (
				<ResolutionInput
					{...props}
					resolution={resolution}
					onChange={setResolution}
				/>
			)}
			<span className={styles.label}>Screen rotation</span>
			{(props) => (
				<Dropdown
					{...props}
					options={["0", "90", "180", "270"]}
					selectedIndex={[0, 90, 180, 270].indexOf(rotation)}
					onSelect={(index) =>
						setRotation([0, 90, 180, 270][index] as 0 | 90 | 180 | 270)
					}
				/>
			)}
			<span className={styles.label}>FPS</span>
			{(props) => (
				<TextInput
					{...props}
					value={fps}
					onChange={(value) => changeIfInt(value, true, setFps)}
					keymap="whole_number"
				/>
			)}
			<span className={styles.label}>Bitrate (Kbps)</span>
			{(props) => (
				<TextInput
					{...props}
					value={bitrate}
					onChange={(value) => changeIfInt(value, true, setBitrate)}
					keymap="whole_number"
				/>
			)}
			<span className={styles.label}>Packet size (bps)</span>
			{(props) => (
				<TextInput
					{...props}
					value={packetSize}
					onChange={(value) => changeIfInt(value, true, setPacketSize)}
					keymap="whole_number"
				/>
			)}
			<span className={styles.label}>Codec</span>
			{(props) => (
				<Dropdown
					{...props}
					options={MOONLIGHT_CODECS}
					selectedIndex={MOONLIGHT_CODECS.indexOf(codec)}
					onSelect={(index) => setCodec(MOONLIGHT_CODECS[index])}
				/>
			)}
			<span className={styles.label}>HDR</span>
			{(props) => <Toggle {...props} enabled={hdr} onChange={setHdr} />}
			<span className={styles.label}>Remote optimizations</span>
			{(props) => (
				<Dropdown
					{...props}
					options={["Enabled", "Disabled", "Auto"]}
					selectedIndex={[true, false, "auto"].indexOf(remoteOptimizations)}
					onSelect={(index) =>
						setRemoteOptimizations(
							[true, false, "auto"][index] as ISettings["remoteOptimizations"],
						)
					}
				/>
			)}
			<span className={styles.label}>Surround sound</span>
			{(props) => (
				<Dropdown
					{...props}
					options={["None", "5.1", "7.1"]}
					selectedIndex={["none", "5.1", "7.1"].indexOf(surroundSound)}
					onSelect={(index) =>
						setSurroundSound(
							["none", "5.1", "7.1"][index] as ISettings["surroundSound"],
						)
					}
				/>
			)}
			<span className={styles.label}>Platform</span>
			{(props) => (
				<Dropdown
					{...props}
					options={MOONLIGHT_PLATFORMS}
					selectedIndex={MOONLIGHT_PLATFORMS.indexOf(platform)}
					onSelect={(index) => setPlatform(MOONLIGHT_PLATFORMS[index])}
				/>
			)}
			<span className={styles.label}>Quit app after session end</span>
			{(props) => (
				<Toggle {...props} enabled={quitAppAfter} onChange={setQuitAppAfter} />
			)}
			<span className={styles.label}>Start app fullscreen</span>
			{(props) => (
				<Toggle
					{...props}
					enabled={startFullscreen}
					onChange={setStartFullscreen}
				/>
			)}
			<span className={styles.label}>Kiosk mode</span>
			{(props) => (
				<Toggle {...props} enabled={kioskMode} onChange={setKioskMode} />
			)}
			{(props) => (
				<Button
					{...props}
					onEnter={() => {
						console.log("Save new settings");
						setIsSaving(true);

						window.ipc
							.invoke("save_settings", {
								moonlightCommand,
								resolution,
								rotation,
								fps,
								bitrate,
								packetSize,
								codec,
								hdr,
								remoteOptimizations,
								surroundSound,
								platform,
								quitAppAfter,
								startFullscreen,
								kioskMode,
							})
							.catch(console.error)
							.finally(() => {
								setIsSaving(false);
							});
					}}
				>
					{isSaving ? "Saving" : "Save"}
				</Button>
			)}
		</NavList>
	);
}
