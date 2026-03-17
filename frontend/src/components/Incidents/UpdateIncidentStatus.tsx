import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useCustomToast from "@/hooks/useCustomToast"
import api from "@/lib/api"
import type { IncidentPublic, IncidentStatus } from "@/types/status"

const STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]

interface UpdateIncidentStatusProps {
  incident: IncidentPublic
}

const UpdateIncidentStatus = ({ incident }: UpdateIncidentStatusProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: (status: IncidentStatus) =>
      api.patch(`/api/v1/incidents/${incident.id}`, { status }),
    onSuccess: () => {
      showSuccessToast("Incident status updated")
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
    },
  })

  return (
    <Select
      defaultValue={incident.status}
      onValueChange={(value) => mutation.mutate(value as IncidentStatus)}
      disabled={mutation.isPending}
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
  )
}

export default UpdateIncidentStatus
