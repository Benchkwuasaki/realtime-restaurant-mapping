import { columns } from "@/components/Employeee/components/columns"
import { DataTable } from "./components/data-table"
import { usePage } from "@inertiajs/react"
import { PageProps } from "@inertiajs/core"

interface Task {
  id: string
  title: string
  status: string
  label: string
  priority: string
}

interface Props extends PageProps {
  tasks: Task[]
}

export default function TaskPage() {
  const { tasks } = usePage<Props>().props

  return (
    <div className="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back!
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your tasks for this month.
          </p>
        </div>
      </div>
      <DataTable data={tasks} columns={columns} />
    </div>
  )
}