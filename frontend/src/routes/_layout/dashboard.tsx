import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AlertTriangle, Check, Server, X } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import api from "@/lib/api"
import type { IncidentsPublic, ServicesPublic } from "@/types/status"

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - StatusPulse",
      },
    ],
  }),
})

function getStatusColor(status: string) {
  switch (status) {
    case "operational":
      return {
        dot: "bg-green-500",
        text: "text-green-600",
        bg: "bg-green-500/10",
      }
    case "degraded":
      return {
        dot: "bg-amber-500",
        text: "text-amber-600",
        bg: "bg-amber-500/10",
      }
    case "major_outage":
    case "down":
      return { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-500/10" }
    case "maintenance":
      return { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-500/10" }
    default:
      return {
        dot: "bg-muted-foreground",
        text: "text-muted-foreground",
        bg: "bg-muted",
      }
  }
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getIncidentAction(status: string) {
  switch (status) {
    case "investigating":
      return "is being investigated"
    case "identified":
      return "cause identified"
    case "monitoring":
      return "is being monitored"
    case "resolved":
      return "has been resolved"
    default:
      return "status updated"
  }
}

function Dashboard() {
  const { user: currentUser } = useAuth()

  const { data: servicesData } = useQuery<ServicesPublic>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/api/v1/services/")
      return res.data
    },
  })

  const { data: incidentsData } = useQuery<IncidentsPublic>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await api.get("/api/v1/incidents/")
      return res.data
    },
  })

  const services = servicesData?.data ?? []
  const incidents = incidentsData?.data ?? []
  const activeIncidents = incidents.filter((i) => i.status !== "resolved")
  const operational = services.filter((s) => s.current_status === "operational")
  const down = services.filter((s) => s.current_status === "down")

  const recentActivity = [...incidents]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5)

  const statCards = [
    {
      label: "Total Services",
      value: services.length,
      icon: Server,
      iconClass: "bg-muted text-muted-foreground",
    },
    {
      label: "Operational",
      value: operational.length,
      icon: Check,
      iconClass: "bg-green-500/10 text-green-600",
    },
    {
      label: "Down",
      value: down.length,
      icon: X,
      iconClass: "bg-red-500/10 text-red-600",
    },
    {
      label: "Active Incidents",
      value: activeIncidents.length,
      icon: AlertTriangle,
      iconClass: "bg-amber-500/10 text-amber-600",
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {currentUser?.full_name || currentUser?.email} · StatusPulse Admin
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border bg-card p-4 relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center ${card.iconClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="font-mono text-3xl font-bold mt-1">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Content blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Activity */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-4">Recent Activity</p>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activity
            </p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((incident) => {
                const colors = getStatusColor(incident.status)
                return (
                  <li key={incident.id} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${colors.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{incident.title}</span>{" "}
                        <span className="text-muted-foreground">
                          {getIncidentAction(incident.status)}
                        </span>
                      </p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                      {timeAgo(incident.created_at)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Services Overview */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-4">Services Overview</p>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No services configured
            </p>
          ) : (
            <ul className="space-y-2">
              {services.map((service) => {
                const colors = getStatusColor(service.current_status)
                const statusLabel =
                  service.current_status.charAt(0).toUpperCase() +
                  service.current_status.slice(1)
                return (
                  <li key={service.id} className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`}
                    />
                    <span className="text-sm flex-1 truncate">
                      {service.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${colors.bg} ${colors.text}`}
                    >
                      {statusLabel}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
