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
	rowContainerClassName?: string;
	rowClassName?: string;
	columnGap?: number;
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
	rowContainerClassName,
	rowClassName,
	parentKey,
	index,
	setUnfocused,
	...props
}: Props) {
	const { width, ref } = useResizeDetector();

	const [columnCount, columnWidth]: [number, number | null] = useMemo(() => {
		const columnGap = props.columnGap ?? 0;
		if (!width) {
			if ("columns" in props) {
				return [props.columns, 10];
			} else {
				return [1, props.maxColumnWidth];
			}
		}
		if ("columns" in props) {
			return [
				props.columns,
				(width - columnGap * (props.columns - 1)) / props.columns,
			];
		}

		for (let i = 1; true; i++) {
			console.log(
				`Checking ${i} columns (${props.maxColumnWidth} * ${i} > ${width})`,
			);
			if (props.maxColumnWidth * i + columnGap * (i - 1) > width) {
				return [i, (width - columnGap * (i - 1)) / i];
			}
		}
	}, [props, width]);

	const rows = useMemo(() => {
		const filteredChildren = toArray(children).filter((child) => !!child);

		const rows: (
			| React.JSX.Element
			| ((props: IFocusableProps) => React.JSX.Element)
		)[][] = [];

		for (let [index, child] of filteredChildren.entries()) {
			const rowNumber = Math.floor(index / columnCount);
			console.log({ columnCount, index, rowNumber });
			const row = rows[rowNumber];
			if (row) {
				row.push(child);
			} else {
				rows.push([child]);
			}
		}

		return rows;
	}, [children, columnCount]);

	console.log({ columnCount, rows });

	return (
		<div className={cc(styles.container, className)} ref={ref}>
			<NavList
				parentKey={parentKey}
				index={index}
				setUnfocused={setUnfocused}
				direction="vertical"
				className={cc(styles.rows, rowContainerClassName)}
			>
				{rows.map((row, i) => (rowProps) => (
					<NavList
						{...rowProps}
						key={i}
						direction="horizontal"
						className={cc(styles.row, rowClassName)}
						style={{
							gap: `${props.columnGap ?? 0}px`,
						}}
					>
						{row.map((item) =>
							typeof item == "function" ? (
								(props) => (
									<div
										className={styles.itemContainer}
										style={{
											width: `${columnWidth}px`,
										}}
									>
										{item(props)}
									</div>
								)
							) : (
								<div
									className={styles.itemContainer}
									style={{
										width: `${columnWidth}px`,
									}}
								>
									{item}
								</div>
							),
						)}
					</NavList>
				))}
			</NavList>
		</div>
	);
}
