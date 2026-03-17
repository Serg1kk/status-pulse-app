import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { DataTable } from "@/components/Common/DataTable"
import AddIncident from "@/components/Incidents/AddIncident"
import { columns } from "@/components/Incidents/columns"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import type { IncidentsPublic } from "@/types/status"

export const Route = createFileRoute("/_layout/incidents")({
  component: Incidents,
  head: () => ({
    meta: [
      {
        title: "Incidents - StatusPulse",
      },
    ],
  }),
})

function Incidents() {
  const { data, isLoading } = useQuery<IncidentsPublic>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await api.get("/api/v1/incidents/")
      return res.data
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage and track incidents</p>
        </div>
        <AddIncident />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No incidents</h3>
          <p className="text-muted-foreground">
            All systems are running smoothly
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={data?.data ?? []} />
      )}
    </div>
  )
}
