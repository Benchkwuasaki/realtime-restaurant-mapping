import { type ColumnDef } from "@tanstack/react-table"

/**
 * Extended column definition used across all DataTable instances.
 *
 * `meta` fields:
 * - `className`       — applied to every <td> cell in the column
 * - `headerClassName` — applied to the <th> in the sub-header row when
 *                       the table uses `headerGroups` (grouped headers).
 *                       Set to "hidden" for columns whose label is already
 *                       rendered by a rowSpan=2 cell in the group row.
 */
export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  /**
   * Optional render function for the mobile card view.
   * If omitted, the column is not shown in card view.
   */
  mobileCard?: (row: TData) => React.ReactNode

  meta?: {
    /** Tailwind classes applied to every <td> in this column */
    className?: string
    /**
     * Tailwind classes applied to the <th> in the sub-header row.
     * Only used when `headerGroups` prop is passed to DataTable.
     * Use "hidden" for columns whose header is covered by a rowSpan=2
     * group cell.
     */
    headerClassName?: string
  }
}