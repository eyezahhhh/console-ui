import NavList from "@component/nav-list";
import IFocusableProps from "@interface/focusable-props.interface";
import OptionalArray from "@interface/optional-array.interface";
import { useMemo } from "react";
import styles from "./nav-grid.module.scss";
import { useResizeDetector } from "react-resize-detector";
import { toArray } from "@util/array.util";
import { cc } from "@util/string.util";

type Props = IFocusableProps & {
	children?: OptionalArray<
		false | React.JSX.Element | ((props: IFocusableProps) => React.JSX.Element)
	>;
	className?: string;
	columnContainerClassName?: string;
	columnClassName?: string;
} & (
		| {
				columns: number;
		  }
		| {
				maxColumnWidth: number;
		  }
	);

export function NavGrid({
	children,
	className,
	columnContainerClassName,
	columnClassName,
	parentKey,
	index,
	setUnfocused,
	...props
}: Props) {
	const { width, ref } = useResizeDetector();

	const [columnCount, maxColumnWidth]: [number, number | null] = useMemo(() => {
		if ("columns" in props) {
			return [props.columns, null];
		}
		if (!width) {
			return [1, props.maxColumnWidth];
		}
		return [Math.ceil(width / props.maxColumnWidth), props.maxColumnWidth];
	}, [props, width]);

	const columns = useMemo(() => {
		const filteredChildren = toArray(children).filter((child) => !!child);

		const columns: (
			| React.JSX.Element
			| ((props: IFocusableProps) => React.JSX.Element)
		)[][] = [];

		for (let i = 0; i < filteredChildren.length; i++) {
			const column = i % columnCount;

			if (columns.length <= column) {
				columns.push([filteredChildren[i]]);
			} else {
				columns[column].push(filteredChildren[i]);
			}
		}

		return columns;
	}, [children, columnCount]);

	return (
		<div className={cc(styles.container, className)} ref={ref}>
			<NavList
				parentKey={parentKey}
				index={index}
				setUnfocused={setUnfocused}
				direction="horizontal"
				className={cc(styles.columns, columnContainerClassName)}
			>
				{columns.map((column, i) => (props) => (
					<div
						className={styles.columnContainer}
						style={{
							maxWidth: maxColumnWidth ? `${maxColumnWidth}px` : undefined,
						}}
						key={i}
					>
						<NavList
							{...props}
							direction="vertical"
							className={cc(styles.column, columnClassName)}
						>
							{column}
						</NavList>
					</div>
				))}
			</NavList>
		</div>
	);
}
