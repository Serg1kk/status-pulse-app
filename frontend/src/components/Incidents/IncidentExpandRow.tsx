import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import api from "@/lib/api"
import type {
  IncidentPublic,
  IncidentStatus,
  IncidentUpdatePublic,
} from "@/types/status"
import { handleError } from "@/utils"

const STATUS_DOT: Record<IncidentStatus, string> = {
  investigating: "bg-red-500",
  identified: "bg-red-500",
  monitoring: "bg-amber-500",
  resolved: "bg-green-500",
}

const STATUS_BADGE: Record<IncidentStatus, string> = {
  investigating: "bg-red-100 text-red-800",
  identified: "bg-red-100 text-red-800",
  monitoring: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
}

const STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface IncidentExpandRowProps {
  incident: IncidentPublic
}

export default function IncidentExpandRow({
  incident,
}: IncidentExpandRowProps) {
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<IncidentStatus>(incident.status)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: updatesData } = useQuery<{
    data: IncidentUpdatePublic[]
    count: number
  }>({
    queryKey: ["incidentUpdates", incident.id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/incidents/${incident.id}/updates`)
      return res.data
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { status: IncidentStatus; message: string }) =>
      api.post(`/api/v1/incidents/${incident.id}/updates`, data),
    onSuccess: () => {
      showSuccessToast("Update posted")
      setMessage("")
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
      queryClient.invalidateQueries({
        queryKey: ["incidentUpdates", incident.id],
      })
    },
    onError: handleError.bind(showErrorToast),
  })

  const updates = updatesData?.data ?? []

  return (
    <div className="bg-muted/30 px-6 py-5 space-y-4">
      {/* Description */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Description
        </div>
        <p className="text-sm leading-relaxed">{incident.description}</p>
      </div>

      {/* Timeline */}
      {updates.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Updates
          </div>
          <div className="space-y-0">
            {updates.map((update, idx) => (
              <div key={update.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full ${STATUS_DOT[update.status]}`}
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
        </div>
      )}

      {/* Add Update form */}
      <div className="flex gap-2 items-end border-t pt-3">
        <Textarea
          placeholder="Add an update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 resize-none"
          rows={2}
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as IncidentStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => mutation.mutate({ status, message })}
          disabled={!message.trim() || mutation.isPending}
          size="sm"
        >
          Post Update
        </Button>
      </div>
    </div>
  )
}
