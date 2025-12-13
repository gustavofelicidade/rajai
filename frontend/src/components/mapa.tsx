import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Layer } from 'leaflet'

import { normalizeBairro } from '@/utils/normalizeBairro'

type BairroProperties = {
  NOME?: string
  [key: string]: any
}

type ChoroplethResponse = {
  meta: { metric: string; geo_join_key: string }
  data: { bairro: string; value: number }[]
}

type TooltipResponse = {
  meta: { bairro: string }
  totais: {
    total: number
    total_in_natura: number
    total_misto: number
    total_ultraprocessado: number
    ratio_ultra_sobre_total: number
  }
  breakdown: Record<string, { classificacao_cnae: string; quantidade: number }[]>
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const GEOJSON_URL =
  'https://gist.githubusercontent.com/esperanc/db213370dd176f8524ae6ba32433f90a/raw/Limite_Bairro.geojson'
const DEFAULT_METRIC = 'total_ultraprocessado'

const mapStyle = { height: '540px', width: '100%' }
const choroplethColors = [
  'var(--choropleth-0)',
  'var(--choropleth-1)',
  'var(--choropleth-2)',
  'var(--choropleth-3)',
  'var(--choropleth-4)',
]

const tooltipCache = new Map<string, TooltipResponse>()

function minMaxFromMap(map: Map<string, number>) {
  const values = Array.from(map.values()).filter((v) => Number.isFinite(v))
  if (!values.length) return { min: 0, max: 0 }
  return { min: Math.min(...values), max: Math.max(...values) }
}

function classIndex(t: number) {
  if (t <= 0.2) return 0
  if (t <= 0.4) return 1
  if (t <= 0.6) return 2
  if (t <= 0.8) return 3
  return 4
}

function formatTooltipHtml(displayName: string, tip: TooltipResponse) {
  const lines: string[] = []
  const nome = displayName || tip.meta.bairro
  lines.push(`<strong>${nome}</strong>`)
  lines.push(`Total: ${tip.totais.total}`)
  lines.push(
    `In natura: ${tip.totais.total_in_natura} | Misto: ${tip.totais.total_misto} | Ultra: ${tip.totais.total_ultraprocessado}`
  )

  const ultraList = (tip.breakdown['Ultraprocessado'] || []).slice().sort((a, b) => b.quantidade - a.quantidade)
  const topUltra = ultraList.slice(0, 3)
  if (topUltra.length) {
    lines.push('<em>Top ultraprocessados</em>')
    topUltra.forEach((item) => lines.push(`${item.classificacao_cnae}: ${item.quantidade}`))
  }

  return lines.join('<br/>')
}

export function Mapa() {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null)
  const [metricsAvailable, setMetricsAvailable] = useState<string[]>([DEFAULT_METRIC])
  const [metric, setMetric] = useState<string>(DEFAULT_METRIC)
  const [valueMap, setValueMap] = useState<Map<string, number>>(new Map())
  const [minMax, setMinMax] = useState<{ min: number; max: number }>({ min: 0, max: 0 })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    // GeoJSON de bairros
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data: FeatureCollection) => {
        if (isMounted.current) setGeoJsonData(data)
      })
      .catch((err) => setError(`Falha ao carregar GeoJSON: ${String(err)}`))
  }, [])

  useEffect(() => {
    // Catálogo de métricas/grupos
    fetch(`${API_BASE}/api/v1/geo/bairros/catalogo`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted.current) return
        if (Array.isArray(json?.metrics)) {
          setMetricsAvailable(json.metrics)
          if (!json.metrics.includes(metric)) {
            setMetric(json.metrics[0] ?? DEFAULT_METRIC)
          }
        }
      })
      .catch((err) => setError(`Falha ao carregar catálogo: ${String(err)}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/api/v1/geo/bairros/choropleth?metric=${metric}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((json: ChoroplethResponse) => {
        if (!isMounted.current) return
        const map = new Map<string, number>()
        json.data.forEach((item) => map.set(normalizeBairro(item.bairro), Number(item.value ?? 0)))
        setValueMap(map)
        setMinMax(minMaxFromMap(map))
      })
      .catch((err) => setError(`Falha ao carregar choropleth: ${String(err)}`))
      .finally(() => {
        if (isMounted.current) setLoading(false)
      })
  }, [metric])

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, BairroProperties>, layer: Layer) => {
      const bairroRaw = feature?.properties?.NOME ?? ''
      const bairroNorm = normalizeBairro(String(bairroRaw))

      layer.on({
        mouseover: async (e: any) => {
          const target = e.target
          target.setStyle({ weight: 2, color: 'rgba(0,0,0,0.5)' })

          if (!bairroNorm) return
          if (!tooltipCache.has(bairroNorm)) {
            try {
              const res = await fetch(
                `${API_BASE}/api/v1/geo/bairros/${encodeURIComponent(bairroNorm)}/tooltip`
              )
              if (res.ok) {
                const json = (await res.json()) as TooltipResponse
                tooltipCache.set(bairroNorm, json)
              }
            } catch (err) {
              // silencioso para não travar hover
            }
          }

          const tip = tooltipCache.get(bairroNorm)
          if (tip) {
            const html = formatTooltipHtml(String(bairroRaw), tip)
            target.bindTooltip(html, { sticky: true, direction: 'auto', opacity: 0.9 }).openTooltip()
          }
        },
        mouseout: (e: any) => {
          const target = e.target
          target.setStyle({ weight: 1, color: 'rgba(0,0,0,0.25)' })
          target.closeTooltip()
        },
      })
    },
    []
  )

  const styleFn = useMemo(() => {
    const min = minMax.min
    const max = minMax.max

    return (feature: Feature<Geometry, BairroProperties>) => {
      const bairro = normalizeBairro(String(feature?.properties?.NOME ?? ''))
      const value = valueMap.get(bairro) ?? 0
      const t = max > min ? (value - min) / (max - min) : 0
      const idx = classIndex(t)
      return {
        weight: 1,
        opacity: 1,
        fillOpacity: 0.75,
        fillColor: choroplethColors[idx],
        color: 'rgba(0,0,0,0.25)',
      }
    }
  }, [valueMap, minMax])

  const legendStops = useMemo(() => {
    const { min, max } = minMax
    if (max <= min) return [{ label: `${min}`, color: choroplethColors[0] }]
    const steps = 4
    const delta = (max - min) / steps
    return Array.from({ length: 5 }, (_, i) => {
      const val = min + delta * i
      return { label: val.toFixed(0), color: choroplethColors[i] }
    })
  }, [minMax])

  const centroRio: [number, number] = [-22.9068, -43.1729]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Métrica</label>
        <select
          className="border rounded-md px-3 py-1 text-sm"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          {metricsAvailable.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {loading ? <span className="text-xs text-muted-foreground">Carregando...</span> : null}
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {legendStops.map((stop, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="inline-block h-3 w-6 rounded-sm" style={{ background: stop.color }} />
            <span>{stop.label}</span>
          </div>
        ))}
      </div>

      <div style={{ height: '580px', width: '100%' }} className="rounded-xl overflow-hidden border">
        <MapContainer center={centroRio} zoom={11} style={mapStyle} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={styleFn as any}
              onEachFeature={onEachFeature as any}
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
