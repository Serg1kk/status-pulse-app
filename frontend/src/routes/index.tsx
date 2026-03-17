import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Logo } from "@/components/Common/Logo"
import IncidentList from "@/components/StatusPage/IncidentList"
import OverallStatus from "@/components/StatusPage/OverallStatus"
import ServiceList from "@/components/StatusPage/ServiceList"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import type { IncidentsPublic, ServicesPublic } from "@/types/status"

export const Route = createFileRoute("/")({
  component: StatusPage,
  head: () => ({
    meta: [
      {
        title: "StatusPulse - System Status",
      },
    ],
  }),
})

function StatusPage() {
  const { data: servicesData, isLoading: servicesLoading } =
    useQuery<ServicesPublic>({
      queryKey: ["publicServices"],
      queryFn: async () => {
        const res = await api.get("/api/v1/status/services")
        return res.data
      },
      refetchInterval: 30000,
    })

  const { data: incidentsData, isLoading: incidentsLoading } =
    useQuery<IncidentsPublic>({
      queryKey: ["publicIncidents"],
      queryFn: async () => {
        const res = await api.get("/api/v1/status/incidents?active_only=true")
        return res.data
      },
      refetchInterval: 30000,
    })

  const services = servicesData?.data ?? []
  const incidents = incidentsData?.data ?? []
  const isLoading = servicesLoading || incidentsLoading

  const cards = [
    <OverallStatus key="overall" services={services} />,
    <ServiceList key="services" services={services} />,
    <IncidentList key="incidents" incidents={incidents} />,
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Logo variant="full" className="text-3xl" />
          <p className="mt-1 text-muted-foreground text-center">
            System Status
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-8">
            {cards.map((card, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {card}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          Powered by StatusPulse <span className="mx-1">·</span>{" "}
          <Link
            to="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Admin Login
          </Link>
        </footer>
      </div>
    </div>
  )
}
