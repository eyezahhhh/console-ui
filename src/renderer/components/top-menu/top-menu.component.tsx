import NavList from "@component/nav-list";
import styles from "./top-menu.module.scss";
import IFocusableProps from "@interface/focusable-props.interface";
import TopMenuButton from "@component/top-menu-button";
import UserIcon from "@icon/user.svg?react";
import SettingsIcon from "@icon/settings.svg?react";
import PowerIcon from "@icon/power.svg?react";

interface Props extends IFocusableProps {}

export function TopMenu(props: Props) {
	return (
		<NavList
			className={styles.container}
			direction="horizontal"
			setUnfocused={props.setUnfocused}
			parentKey={props.parentKey}
			index={props.index}
		>
			{(props) => <TopMenuButton {...props} icon={<UserIcon />} />}
			{(props) => <TopMenuButton {...props} icon={<SettingsIcon />} />}
			{(props) => <TopMenuButton {...props} icon={<PowerIcon />} />}
		</NavList>
	);
}
