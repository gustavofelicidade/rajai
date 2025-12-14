import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"

type Producer = {
  id: string
  nome: string
  bairro: string
  lat: number
  lon: number
}

type DestinoKind = "bairro" | "hub"

type Destino = {
  id: string
  bairro: string
  nome?: string
  lat: number
  lon: number
  demand: number
  kind: DestinoKind
}

type RouteItem = {
  produtor: Producer
  destino: Destino
  distance_km: number
  custo_estimado: number
}

type RouteResponse = {
  meta: { algorithm: string }
  total_distance_km: number
  total_custo_estimado: number
  routes: RouteItem[]
  ai_resumo?: string
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Produtores/cooperativas base para exibir mesmo sem backend
const PRODUCER_PRESETS: Producer[] = [
  { id: "prod-1", nome: "Cooperativa Campo Grande", bairro: "Campo Grande", lat: -22.904, lon: -43.565 },
  { id: "prod-2", nome: "Hortifruti Madureira", bairro: "Madureira", lat: -22.873, lon: -43.340 },
  { id: "prod-3", nome: "Orgânicos Zona Oeste", bairro: "Bangu", lat: -22.876, lon: -43.459 },
]

// Presets de destinos (bairros e centros logísticos do RJ)
const DESTINO_PRESETS: Destino[] = [
  { id: "dest-1", bairro: "Bangu", nome: "Bangu", lat: -22.875, lon: -43.4604, demand: 5, kind: "bairro" },
  { id: "dest-2", bairro: "Madureira", nome: "Madureira", lat: -22.8735, lon: -43.3375, demand: 7, kind: "bairro" },
  { id: "dest-3", bairro: "Vila Isabel", nome: "Vila Isabel", lat: -22.9231, lon: -43.2485, demand: 4, kind: "bairro" },
  { id: "dest-4", bairro: "Zona Portuaria", nome: "Zona Portuária", lat: -22.897, lon: -43.186, demand: 6, kind: "bairro" },
  { id: "dest-5", bairro: "Complexo da Maré", nome: "Complexo da Maré", lat: -22.856, lon: -43.246, demand: 8, kind: "bairro" },
  { id: "dest-6", bairro: "Jacarezinho", nome: "Jacarezinho", lat: -22.894, lon: -43.257, demand: 5, kind: "bairro" },

  // hubs
  { id: "hub-1", bairro: "CEASA Irajá", nome: "CEASA Irajá", lat: -22.8386, lon: -43.3145, demand: 10, kind: "hub" },
  { id: "hub-2", bairro: "Campo Grande", nome: "Campo Grande (Hub)", lat: -22.9028, lon: -43.5586, demand: 6, kind: "hub" },
]

export function LogisticaPanel() {
  const [producers, setProducers] = useState<Producer[]>(PRODUCER_PRESETS)
  const [destinosCatalogo, setDestinosCatalogo] = useState<Destino[]>(DESTINO_PRESETS)
  const [bairrosSelecionados, setBairrosSelecionados] = useState<string[]>(
    DESTINO_PRESETS.filter((d) => d.kind === "bairro")
      .slice(0, 3)
      .map((d) => d.id)
  )
  const [hubsSelecionados, setHubsSelecionados] = useState<string[]>(
    DESTINO_PRESETS.filter((d) => d.kind === "hub")
      .slice(0, 1)
      .map((d) => d.id)
  )
  const destinosSelecionadosIds = [...bairrosSelecionados, ...hubsSelecionados]
  const [destinos, setDestinos] = useState<Destino[]>(
    DESTINO_PRESETS.filter((d) => destinosSelecionadosIds.includes(d.id))
  )
  const [produtorSelecionado, setProdutorSelecionado] = useState<string>(PRODUCER_PRESETS[0]?.id ?? "")
  const [produtorCatalogo, setProdutorCatalogo] = useState<Producer[]>(PRODUCER_PRESETS)
  const [routes, setRoutes] = useState<RouteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const selecionados = [...bairrosSelecionados, ...hubsSelecionados]
    const novos = destinosCatalogo.filter((d) => selecionados.includes(d.id))
    setDestinos(novos)
  }, [bairrosSelecionados, hubsSelecionados, destinosCatalogo])

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/logistica/demo`)
      .then((res) => res.json())
      .then((json) => {
        if (json.producers?.length) {
          setProducers(json.producers)
          setProdutorCatalogo(json.producers)
          setProdutorSelecionado(json.producers?.[0]?.id ?? "")
        }
      })
      .catch((err) => setError(`Falha ao carregar demo: ${String(err)}`))

    fetch(`${API_BASE}/api/v1/geo/bairros/catalogo`)
      .then((res) => res.json())
      .then((json) => {
        const bairros = (json.bairros ?? []) as string[]
        const extra = bairros
          .filter((b: string) => !DESTINO_PRESETS.find((d) => d.bairro.toLowerCase() === b.toLowerCase()))
          .map((b, idx) => ({
            id: `bairro-${idx}-${b}`,
            bairro: b,
            nome: b,
            lat: -22.9,
            lon: -43.2,
            demand: 5,
            kind: "bairro" as const,
          }))
        setDestinosCatalogo([...DESTINO_PRESETS, ...extra])
      })
      .catch(() => {})
  }, [])

  const gerarRotas = async () => {
    setLoading(true)
    setError(null)
    try {
      const produtoresUsados =
        produtorSelecionado && produtorCatalogo.length
          ? produtorCatalogo.filter((p) => p.id === produtorSelecionado)
          : producers
      const res = await fetch(`${API_BASE}/api/v1/logistica/rotas-candidatas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producers: produtoresUsados, destinos }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const json = (await res.json()) as RouteResponse
      setRoutes(json)
    } catch (err) {
      setError(`Erro ao gerar rotas: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Heurística inicial: vizinho mais próximo</p>
          <p className="text-xs text-muted-foreground">Origens: produtores/cooperativas. Destinos: bairros prioritários.</p>
        </div>
        <Button size="sm" onClick={gerarRotas} disabled={loading}>
          {loading ? "Calculando..." : "Gerar rotas"}
        </Button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <Card title="Pontos de entrega e hubs">
        <p className="text-xs text-muted-foreground mb-3">
          Escolha bairros-alvo (desertos alimentares) e hubs (ex.: CEASA) para gerar rotas candidatas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MultiSelectDropdown
            title="Bairros-alvo (desertos alimentares)"
            items={destinosCatalogo.filter((d) => d.kind === "bairro")}
            selected={bairrosSelecionados}
            onChange={setBairrosSelecionados}
            placeholder="Selecione bairros..."
          />

          <MultiSelectDropdown
            title="Centros de distribuição (hubs)"
            items={destinosCatalogo.filter((d) => d.kind === "hub")}
            selected={hubsSelecionados}
            onChange={setHubsSelecionados}
            placeholder="Selecione hubs..."
          />
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Selecionados: {destinosSelecionadosIds.length} ponto(s) (bairros + hubs).
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="Produtores / Cooperativas">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Selecionar produtor</label>
            <select
              className="w-full border rounded px-2 py-2 text-sm"
              value={produtorSelecionado}
              onChange={(e) => setProdutorSelecionado(e.target.value)}
            >
              {produtorCatalogo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.bairro}
                </option>
              ))}
            </select>
            <ul className="space-y-2 text-sm">
              {produtorCatalogo
                .filter((p) => !produtorSelecionado || p.id === produtorSelecionado)
                .map((p) => (
                  <li key={p.id} className="rounded border p-2">
                    <div className="font-semibold">{p.nome}</div>
                    <div className="text-muted-foreground">Bairro: {p.bairro}</div>
                    <div className="text-xs text-muted-foreground">
                      Lat/Lon: {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </Card>

        <Card title="Destinos selecionados (bairros e hubs)">
          <ul className="space-y-2 text-sm">
            {destinos.map((d) => (
              <li key={d.id} className="rounded border p-2">
                <div className="font-semibold">{d.bairro}</div>
                <div className="text-muted-foreground">Demanda: {d.demand}</div>
                <div className="text-xs text-muted-foreground">
                  Lat/Lon: {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {routes ? (
        <div className="space-y-2 rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Algoritmo: {routes.meta.algorithm}</Badge>
            <Badge>
              Distância total: <strong className="ml-1">{routes.total_distance_km} km</strong>
            </Badge>
            <Badge>
              Custo estimado: <strong className="ml-1">{routes.total_custo_estimado}</strong>
            </Badge>
          </div>
          {routes.ai_resumo ? (
            <div className="text-sm text-muted-foreground border rounded p-2 bg-muted/40">{routes.ai_resumo}</div>
          ) : null}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Produtor</th>
                  <th className="text-left py-2">Destino</th>
                  <th className="text-right py-2">Demanda</th>
                  <th className="text-right py-2">Dist. (km)</th>
                  <th className="text-right py-2">Custo</th>
                </tr>
              </thead>
              <tbody>
                {routes.routes.map((r) => (
                  <tr key={`${r.produtor.id}-${r.destino.id}`} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-semibold">{r.produtor.nome}</div>
                      <div className="text-xs text-muted-foreground">{r.produtor.bairro}</div>
                    </td>
                    <td className="py-2">
                      <div className="font-semibold">{r.destino.bairro}</div>
                    </td>
                    <td className="py-2 text-right">{r.destino.demand}</td>
                    <td className="py-2 text-right">{r.distance_km}</td>
                    <td className="py-2 text-right">{r.custo_estimado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Clique em "Gerar rotas" para ver candidatos.</div>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-sm font-semibold mb-2">{title}</div>
      {children}
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold bg-muted/60",
        className,
      )}
    >
      {children}
    </span>
  )
}

function MultiSelectDropdown({
  title,
  items,
  selected,
  onChange,
  placeholder = "Selecionar...",
}: {
  title: string
  items: Destino[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id))
    else onChange([...selected, id])
  }

  const selectedLabels = items
    .filter((i) => selected.includes(i.id))
    .slice(0, 2)
    .map((i) => i.nome || i.bairro)

  const badgeText =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.join(", ")} +${selected.length - 2}`

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">{title}</div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className={cn("truncate text-left", selected.length === 0 && "text-muted-foreground")}>
              {badgeText}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-auto">
              {items.map((it) => {
                const checked = selected.includes(it.id)
                return (
                  <CommandItem
                    key={it.id}
                    value={`${it.nome || it.bairro}`}
                    onSelect={() => toggle(it.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{it.nome || it.bairro}</span>
                      <span className="text-xs text-muted-foreground">
                        demanda {it.demand} • lat {it.lat.toFixed(3)} • lon {it.lon.toFixed(3)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "ml-2 inline-flex h-5 w-5 items-center justify-center rounded border",
                        checked && "bg-muted"
                      )}
                    >
                      {checked ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {items
            .filter((i) => selected.includes(i.id))
            .map((i) => (
              <span key={i.id} className="text-xs rounded-full border px-2 py-1 bg-muted/40">
                {i.nome || i.bairro}
              </span>
            ))}
        </div>
      ) : null}
    </div>
  )
}
