import { useEffect, useState } from "react"
import { columns, Payment } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  return [
    {
      id: "1",
      title: "Document 1",
      requestingOffice: "Office A",
      forwardingOffice: "Office B",
      currentHolder: "John Doe",
      stepStatus: "pending"
    },
    {
      id: "2",
      title: "Document 2",
      requestingOffice: "Office A",
      forwardingOffice: "Office B",
      currentHolder: "Kiks",
      stepStatus: "pending"
    },
  ]
}

export default function TablePage() {
  const [data, setData] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const result = await getData()
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  return (
    <div className="container mx-auto py-5">
      <DataTable columns={columns} data={data} />
    </div>
  )
}