import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { IncidentPublic, IncidentStatus } from "@/types/status"

const STATUS_DOT: Record<IncidentStatus, string> = {
  investigating: "bg-red-500",
  identified: "bg-red-500",
  monitoring: "bg-amber-500",
  resolved: "bg-green-500",
}

const STATUS_LABEL: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
}

const STATUS_BADGE: Record<IncidentStatus, string> = {
  investigating: "bg-red-100 text-red-800",
  identified: "bg-red-100 text-red-800",
  monitoring: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface IncidentListProps {
  incidents: IncidentPublic[]
}

export default function IncidentList({ incidents }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No active incidents
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Active Incidents</h2>
      {incidents.map((incident) => (
        <IncidentAccordion key={incident.id} incident={incident} />
      ))}
    </div>
  )
}

function IncidentAccordion({ incident }: { incident: IncidentPublic }) {
  const [isOpen, setIsOpen] = useState(false)
  const updates = incident.updates ?? []

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="py-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[incident.status]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{incident.title}</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[incident.status]}`}
                  >
                    {STATUS_LABEL[incident.status]}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Started {timeAgo(incident.created_at)}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-5 pt-0 border-t">
            {/* Description */}
            {incident.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-4">
                {incident.description}
              </p>
            )}
            {/* Timeline */}
            {updates.length > 0 && (
              <div className="space-y-0">
                {updates.map((update, idx) => (
                  <div key={update.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${STATUS_DOT[update.status]} ring-2 ring-background`}
                      />
                      {idx < updates.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-[20px]" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_BADGE[update.status]}`}
                        >
                          {update.status}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(update.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{update.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
