import type { PageProps } from "@inertiajs/core"
import { usePage } from "@inertiajs/react"
import { columns } from "@/components/Employeee/components/columns"
import { DataTable } from "./components/data-table"

interface Employee {
  id: string
  name: string
  position: string
  unit: string
  division: string
  department: string
  contactNumber: string
  email: string
  status: boolean
}

interface Props extends PageProps {
  employee: Employee[]
}

export default function EmployeePage() {
  const { employee } = usePage<Props>().props

  return (
    <div className="flex h-full flex-1 flex-col gap-8 py-4">
      <DataTable data={employee} columns={columns} />
    </div>
  )
}