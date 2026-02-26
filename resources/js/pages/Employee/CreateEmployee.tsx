import CreateEmployeeForm, { type CreateEmployeeProps } from '@/components/Employeee/create_employee'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employee', href: '/employee' },
    { title: 'Create Employee', href: '/employee/create' },
]

export default function CreateEmployee(props: CreateEmployeeProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <CreateEmployeeForm {...props} />
        </AppLayout>
    )
}