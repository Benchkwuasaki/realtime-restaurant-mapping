import type { PageProps } from "@inertiajs/core"
import { usePage } from "@inertiajs/react"
import { columns } from "@/components/Employeee/components/columns"
import { DataTable } from "@/components/shared/data-table/data-table"

interface Task {
  id: string
  name: string
  position: string
  unit: string
  division: string
  department: string
  contactNumber: string
  email: string
  status: "Active" | "Inactive"
}

interface Props extends PageProps {
  tasks: Task[]
}

export default function TaskPage() {
  const { tasks } = usePage<Props>().props

  return (
    <div className="hidden h-full flex-1 flex-col gap-8 p-4 md:flex">
      <DataTable data={tasks} columns={columns} />
    </div>
  )
}