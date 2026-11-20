/**
 * QuantumEV frontend domain types.
 *
 * Phase 2 renders these from `src/data/sample.ts` (clearly labelled sample
 * data). From Phase 3 onwards the same shapes are served by the FastAPI
 * backend, so no page component has to change when the data source is swapped.
 */

export type Role = 'admin' | 'owner' | 'operator'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  initials: string
  zoneId: ZoneId | null
  /** Phase 2 sessions are demo-only; Phase 3 replaces this with a real JWT. */
  demo: boolean
}

export type ZoneId = 'zone-north' | 'zone-central' | 'zone-south'

export interface Zone {
  id: ZoneId
  name: string
  label: string
  center: { lat: number; lng: number }
  gridCapacityKW: number
  evCount: number
}

export type ConnectorType = 'CCS2' | 'Type2' | 'CHAdeMO'

export type VehicleStatus = 'idle' | 'charging' | 'waiting' | 'en-route' | 'discharging'

export interface Vehicle {
  id: string
  label: string
  plate: string
  ownerId: string
  ownerName: string
  model: string
  batteryCapacityKWh: number
  batteryPercent: number
  rangeKm: number
  connector: ConnectorType
  zoneId: ZoneId
  status: VehicleStatus
  currentStationId: string | null
  requestedEnergyKWh: number
  priority: number
  lastUpdated: string
}

export type StationStatus = 'available' | 'busy' | 'maintenance' | 'offline'

export interface Station {
  id: string
  name: string
  zoneId: ZoneId
  location: { lat: number; lng: number }
  address: string
  chargers: number
  powerKW: number
  connector: ConnectorType
  status: StationStatus
  activeSessions: number
  queueLength: number
  pricePerKWh: number
  utilizationPct: number
  solarSharePct: number
  hasBatteryStorage: boolean
}

export type RequestStatus =
  | 'pending'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'rejected'

export interface ChargingRequest {
  id: string
  vehicleId: string
  vehicleLabel: string
  ownerName: string
  zoneId: ZoneId
  requestedEnergyKWh: number
  requestedAt: string
  priority: number
  status: RequestStatus
  assignedStationId: string | null
  assignedStationName: string | null
  assignedSlot: string | null
  estimatedCost: number | null
  estimatedMinutes: number | null
}

export interface ChargingSession {
  id: string
  vehicleId: string
  vehicleLabel: string
  stationId: string
  stationName: string
  zoneId: ZoneId
  startTime: string
  powerKW: number
  energyDeliveredKWh: number
  targetKWh: number
  progressPct: number
  costSoFar: number
  status: 'active' | 'completed'
}

export interface GridSnapshot {
  timestamp: string
  totalLoadKW: number
  gridCapacityKW: number
  utilizationPct: number
  solarGenerationKW: number
  evLoadKW: number
  baseLoadKW: number
  batteryStorageKWh: number
  batteryCapacityKWh: number
  batterySOCPct: number
  frequencyHz: number
  voltageV: number
}

export interface GridPoint {
  hour: string
  baseLoadKW: number
  evLoadKW: number
  solarKW: number
  totalLoadKW: number
  capacityKW: number
  utilizationPct: number
  pricePerKWh: number
}

export interface ZoneLoad {
  zoneId: ZoneId
  zoneName: string
  label: string
  loadKW: number
  capacityKW: number
  utilizationPct: number
  evCount: number
  activeSessions: number
  solarKW: number
}

export interface RegressionMetrics {
  mae: number
  rmse: number
  r2: number
  mapePct: number
  testSamples: number
}

export interface ForecastModelInfo {
  algorithm: string
  features: string[]
  trainedAt: string
  trainSamples: number
}

export interface ForecastPoint {
  /** Hour label, e.g. "14:00". */
  label: string
  /** Observed value — null for future (forecast-only) points. */
  actual: number | null
  predicted: number
}

export interface ForecastModel {
  id: 'demand' | 'price' | 'solar'
  name: string
  description: string
  unit: string
  /** Hours of the next-day outlook at the end of the series. */
  horizonHours: number
  metrics: RegressionMetrics
  info: ForecastModelInfo
  points: ForecastPoint[]
}

export interface QuboPenaltyWeights {
  energyCost: number
  waiting: number
  gridOverload: number
  stationCapacity: number
  assignment: number
  renewableBonus: number
}

export interface QuboSummary {
  variables: number
  quadraticTerms: number
  densityPct: number
  qubits: number
  penaltyWeights: QuboPenaltyWeights
  constraints: { name: string; type: 'equality' | 'inequality'; enforcedBy: string; satisfied: boolean }[]
  instancedescription: string
  decomposition: string
}

export interface QaoaRunInfo {
  qubits: number
  depth: number
  shots: number
  optimizer: string
  iterations: number
  bestBitstring: string
  bestObjective: number
  meanObjective: number
  stdObjective: number
  feasibleBitstrings: number
  approximationRatio: number | null
}

export interface ClassicalRunInfo {
  solver: string
  status: string
  optimal: boolean
  wallTimeSeconds: number
  variables: number
  constraints: number
}

export type SolverKind = 'QAOA' | 'CP-SAT'

export interface OptimizationRun {
  id: string
  label: string
  createdAt: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  solver: SolverKind
  objective: number
  energyCost: number
  waitingCost: number
  gridOverloadPenalty: number
  renewableCredit: number
  runtimeSeconds: number
  feasible: boolean
  constraintViolations: number
  gridUtilizationPct: number
  peakGridLoadKW: number
  assignedEVs: number
  unassignedEVs: number
  avgWaitMinutes: number
  costPerEV: number
  qaoa: QaoaRunInfo | null
  classical: ClassicalRunInfo | null
}

export interface ScheduleAssignment {
  id: string
  vehicleId: string
  vehicleLabel: string
  stationId: string
  stationName: string
  zoneName: string
  slotIndex: number
  slotLabel: string
  energyKWh: number
  estimatedCost: number
  durationMinutes: number
  priority: number
  gridLoadAtSlotPct: number
  renewableSharePct: number
  source: 'QUBO + QAOA' | 'CP-SAT' | 'hybrid'
}

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

export interface AppNotification {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  category: 'grid' | 'charging' | 'optimization' | 'ai' | 'system'
  createdAt: string
  read: boolean
}

export interface ZoneReport {
  zoneId: ZoneId
  zoneName: string
  label: string
  energyDeliveredKWh: number
  revenue: number
  sessionsCompleted: number
  avgWaitMinutes: number
  co2AvoidedKg: number
  utilizationPct: number
}

export interface DailyReportPoint {
  date: string
  energyKWh: number
  cost: number
  sessions: number
  gridUtilizationPct: number
  solarSharePct: number
}

export interface ReportSummary {
  period: string
  energyDeliveredKWh: number
  costSavedAmount: number
  baselineCostAmount: number
  savingsPct: number
  co2AvoidedKg: number
  sessionsCompleted: number
  avgCostPerKWh: number
  stationUptimePct: number
  avgWaitMinutes: number
  daily: DailyReportPoint[]
  zones: ZoneReport[]
}

export interface PlatformKpis {
  totalEVs: number
  activeSessions: number
  availableStations: number
  totalStations: number
  energyConsumedKWh: number
  gridUtilizationPct: number
  solarGenerationKW: number
  predictedDemandKWh: number
  predictedPricePerKWh: number
  estimatedScheduleCost: number
  costSavingVsBaselinePct: number
}
