export type ServiceStatus = "operational" | "degraded" | "down"

export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved"

export interface ServicePublic {
  id: string
  name: string
  url: string
  category: string
  check_interval: number
  current_status: ServiceStatus
  created_at: string
}

export interface ServicesPublic {
  data: ServicePublic[]
  count: number
}

export interface HealthCheckPublic {
  id: string
  service_id: string
  status_code: number | null
  response_time_ms: number
  is_healthy: boolean
  checked_at: string
}

export interface IncidentUpdatePublic {
  id: string
  incident_id: string
  status: IncidentStatus
  message: string
  created_at: string
}

export interface IncidentPublic {
  id: string
  service_id: string
  title: string
  description: string
  status: IncidentStatus
  created_at: string
  resolved_at: string | null
  updates: IncidentUpdatePublic[]
}

export interface IncidentsPublic {
  data: IncidentPublic[]
  count: number
}
