import axios from 'axios'

/**
 * Base URL of the QuantumEV FastAPI backend.
 * Configured through `VITE_API_BASE_URL` (see frontend/.env.example).
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const WS_BASE_URL: string =
  import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000'

export interface HealthResponse {
  status: string
  service: string
  version: string
  environment: string
  data_source: string
  uptime_seconds: number
}

export interface DependencyCheck {
  package: string
  phase: string
  status: 'ok' | 'error'
  version: string | null
  error: string | null
}

export interface DependencyResponse {
  status: string
  python: string
  platform: string
  failed: string[]
  checks: DependencyCheck[]
}

/** Shared axios instance — later phases add auth interceptors here. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/api/v1/health')
  return data
}

export async function fetchDependencies(): Promise<DependencyResponse> {
  const { data } = await api.get<DependencyResponse>('/api/v1/health/dependencies')
  return data
}
