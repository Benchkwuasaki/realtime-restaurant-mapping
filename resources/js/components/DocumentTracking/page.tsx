import { useEffect, useState } from "react"
import { DataTable } from "@/components/shared/data-table/data-table"
import { columns, Document } from "./columns"

async function getData(): Promise<Document[]> {
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
      stepStatus: "success"
    },
  ]
}

export default function TablePage() {
  const [data, setData] = useState<Document[]>([])
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