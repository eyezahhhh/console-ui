import NavList from "@component/nav-list";
import styles from "./top-menu.module.scss";
import IFocusableProps from "@interface/focusable-props.interface";
import TopMenuButton from "@component/top-menu-button";
import { useNavigate } from "react-router";
import useGamepads from "@hook/gamepads.hook";
import GamepadIndicator from "@component/gamepad-indicator";
import PowerMenu from "@component/power-menu";
import { useState } from "react";
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
	const { availableUpdate } = useUpdate();
	const [powerMenuOpen, setPowerMenuOpen] = useState(false);
	const [updateModalOpen, setUpdateModalOpen] = useState(false);

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
				{(props) => (
					<TopMenuButton
						{...props}
						icon={<Computer />}
						key="machines"
						onEnter={() => navigate("/")}
					/>
				)}
				{(!!availableUpdate || true) &&
					((props) => (
						<TopMenuButton
							{...props}
							icon={<SystemUpdateAlt />}
							key="update"
							onEnter={() => setUpdateModalOpen(true)}
						/>
					))}
				{(props) => (
					<TopMenuButton
						{...props}
						icon={<Settings />}
						key="settings"
						onEnter={() => navigate("/settings")}
					/>
				)}
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
