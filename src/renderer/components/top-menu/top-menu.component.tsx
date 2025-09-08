import NavList from "@component/nav-list";
import styles from "./top-menu.module.scss";
import IFocusableProps from "@interface/focusable-props.interface";
import TopMenuButton from "@component/top-menu-button";
import { useNavigate } from "react-router";
import useGamepads from "@hook/gamepads.hook";
import GamepadIndicator from "@component/gamepad-indicator";
import PowerMenu from "@component/power-menu";
import { useEffect, useState } from "react";
import {
	Computer,
	PowerSettingsNew,
	Settings,
	SystemUpdateAlt,
} from "@mui/icons-material";
import useUpdate from "@hook/update.hook";
import UpdateModal from "@component/update-modal";

interface Props extends IFocusableProps {}

export function TopMenu(props: Props) {
	const navigate = useNavigate();
	const gamepads = useGamepads();
	const { availableUpdate, isDownloading } = useUpdate();
	const [powerMenuOpen, setPowerMenuOpen] = useState(false);
	const [updateModalOpen, setUpdateModalOpen] = useState(false);

	useEffect(() => {
		if (updateModalOpen && isDownloading) {
			setUpdateModalOpen(false);
		}
	}, [updateModalOpen, isDownloading]);

	return (
		<div className={styles.container}>
			<PowerMenu open={powerMenuOpen} onClose={() => setPowerMenuOpen(false)} />
			<UpdateModal
				open={updateModalOpen}
				onClose={() => setUpdateModalOpen(false)}
			/>
			<div className={styles.gamepadsContainer}>
				{gamepads.map((gamepad) => (
					<GamepadIndicator key={gamepad.index} gamepadIndex={gamepad.index} />
				))}
			</div>
			<NavList
				className={styles.buttonsContainer}
				direction="horizontal"
				setUnfocused={props.setUnfocused}
				parentKey={props.parentKey}
				index={props.index}
			>
				{!isDownloading &&
					((props) => (
						<TopMenuButton
							{...props}
							icon={<Computer />}
							key="machines"
							onEnter={() => navigate("/")}
						/>
					))}
				{!isDownloading &&
					!!availableUpdate &&
					((props) => (
						<TopMenuButton
							{...props}
							icon={<SystemUpdateAlt />}
							key="update"
							onEnter={() => setUpdateModalOpen(true)}
						/>
					))}
				{!isDownloading &&
					((props) => (
						<TopMenuButton
							{...props}
							icon={<Settings />}
							key="settings"
							onEnter={() => navigate("/settings")}
						/>
					))}
				{(props) => (
					<TopMenuButton
						{...props}
						icon={<PowerSettingsNew />}
						key="power"
						onEnter={() => setPowerMenuOpen(true)}
					/>
				)}
			</NavList>
		</div>
	);
}
