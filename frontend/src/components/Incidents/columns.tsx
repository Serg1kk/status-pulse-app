import type { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { IncidentPublic, IncidentStatus } from "@/types/status"

const STATUS_VARIANT: Record<
  IncidentStatus,
  "destructive" | "secondary" | "outline" | "default"
> = {
  investigating: "destructive",
  identified: "destructive",
  monitoring: "secondary",
  resolved: "outline",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

export const columns: ColumnDef<IncidentPublic>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded()
      return (
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )
    },
    size: 40,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.created_at)}
      </span>
    ),
  },
]
