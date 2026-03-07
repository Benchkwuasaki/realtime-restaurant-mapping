import { ArrowUpDown, ChevronsUpDown, MoreHorizontal, MoreVertical } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Document = {
  id: string
  title: string
  requestingOffice: string
  forwardingOffice: string
  currentHolder: string
  stepStatus: "pending" | "processing" | "success" | "failed"
}

export const columns: ColumnDef<Document>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button className="-mx-3" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Title
          <ChevronsUpDown/>
        </Button>
      )
    },
  },
  {
    accessorKey: "requestingOffice",
    header: ({ column }) => {
      return (
        <Button className="-mx-3" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Requesting Office
          <ChevronsUpDown/>
        </Button>
      )
    },
  },
  {
    accessorKey: "forwardingOffice",
    header: ({ column }) => {
      return (
        <Button className="-mx-3" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Forwarding Office
          <ChevronsUpDown/>
        </Button>
      )
    },
  },
  {
    accessorKey: "currentHolder",
    header: ({ column }) => {
      return (
        <Button className="-mx-3" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Current Holder
          <ChevronsUpDown/>
        </Button>
      )
    },
  },
  {
    accessorKey: "stepStatus",
    header: ({ column }) => {
      return (
        <Button className="-mx-3" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Step Status
          <ChevronsUpDown/>
        </Button>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Document</DropdownMenuItem>
            <DropdownMenuItem>Edit Document</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
]
