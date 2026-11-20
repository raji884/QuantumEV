/**
 * Leaflet map of the 3 city zones and the 10 charging stations.
 *
 * Uses CircleMarker / Circle instead of the default Leaflet Marker so no image
 * assets are required (the default marker icons break under Vite bundling).
 */

import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip as LeafletTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import type { Station, StationStatus, Zone } from '../../types'
import { formatKW, formatPercent } from '../../lib/format'

const STATUS_COLOR: Record<StationStatus, string> = {
  available: '#34d399',
  busy: '#fbbf24',
  maintenance: '#38bdf8',
  offline: '#fb7185',
}

const STATUS_LABEL: Record<StationStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  maintenance: 'Maintenance',
  offline: 'Offline',
}

export const STATION_STATUS_COLOR = STATUS_COLOR

interface StationMapProps {
  stations: Station[]
  zones: Zone[]
  height?: number
  showZones?: boolean
  onSelectStation?: (stationId: string) => void
  className?: string
}

export function StationMap({
  stations,
  zones,
  height = 420,
  showZones = true,
  onSelectStation,
  className = '',
}: StationMapProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-white/10 ${className}`}>
      <MapContainer
        center={[12.972, 77.594]}
        zoom={11}
        scrollWheelZoom
        style={{ height, width: '100%', background: '#0a1020' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {showZones
          ? zones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.center.lat, zone.center.lng]}
                radius={1900}
                pathOptions={{
                  color: '#6366f1',
                  weight: 1,
                  opacity: 0.55,
                  fillColor: '#6366f1',
                  fillOpacity: 0.07,
                }}
              >
                <LeafletTooltip direction="center" permanent className="border-0 bg-transparent">
                  <span className="text-[11px] font-semibold tracking-wide text-indigo-300 uppercase">
                    {zone.name}
                  </span>
                </LeafletTooltip>
              </Circle>
            ))
          : null}

        {stations.map((station) => {
          const color = STATUS_COLOR[station.status]
          return (
            <CircleMarker
              key={station.id}
              center={[station.location.lat, station.location.lng]}
              radius={Math.max(6, Math.min(13, station.chargers * 0.75))}
              pathOptions={{
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.45,
              }}
              eventHandlers={{
                click: () => onSelectStation?.(station.id),
              }}
            >
              <Popup>
                <div className="min-w-[190px] text-[12px] leading-relaxed">
                  <p className="font-semibold text-slate-100">{station.name}</p>
                  <p className="text-slate-400">{station.address}</p>
                  <p className="mt-1 text-slate-300">
                    Status: <span style={{ color }}>{STATUS_LABEL[station.status]}</span>
                  </p>
                  <p className="text-slate-300">
                    {station.chargers} chargers · {formatKW(station.powerKW)} · {station.connector}
                  </p>
                  <p className="text-slate-300">
                    Utilisation {formatPercent(station.utilizationPct)} · queue {station.queueLength}
                  </p>
                  <p className="text-slate-300">₹{station.pricePerKWh.toFixed(2)}/kWh</p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 bg-black/20 px-3 py-2 text-[11px] text-slate-400">
        {(Object.keys(STATUS_COLOR) as StationStatus[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: STATUS_COLOR[status] }}
            />
            {STATUS_LABEL[status]}
          </span>
        ))}
        <span className="ml-auto font-mono text-slate-500">
          {stations.length} stations · {zones.length} zones
        </span>
      </div>
    </div>
  )
}
