import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { DataTable } from "@/components/Common/DataTable"
import AddService from "@/components/Services/AddService"
import { columns } from "@/components/Services/columns"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import type { ServicesPublic } from "@/types/status"

export const Route = createFileRoute("/_layout/services")({
  component: Services,
  head: () => ({
    meta: [
      {
        title: "Services - StatusPulse",
      },
    ],
  }),
})

function Services() {
  const { data, isLoading } = useQuery<ServicesPublic>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/api/v1/services/")
      return res.data
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage monitored services</p>
        </div>
        <AddService />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No services yet</h3>
          <p className="text-muted-foreground">
            Add a service to start monitoring
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={data?.data ?? []} />
      )}
    </div>
  )
}
