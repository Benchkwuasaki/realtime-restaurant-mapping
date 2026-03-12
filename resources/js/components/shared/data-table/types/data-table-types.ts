import { type ColumnDef } from "@tanstack/react-table"

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  /**
   * Optional render function for the mobile card view.
   * If omitted, the column is not shown in card view.
   */
  mobileCard?: (row: TData) => React.ReactNode

  width?: number | string
}