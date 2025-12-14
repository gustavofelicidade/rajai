import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"

import { Mapa } from "@/components/mapa";
// Adicionei BookOpen aos imports
import { AlertCircle, Leaf, UtensilsCrossed, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Adicionado para acessibilidade/semântica
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

// --- DADOS DO GLOSSÁRIO ---
// Baseado na imagem enviada e conceitos estatísticos comuns
const glossaryItems = [
  {
    value: "totais",
    label: "Totais Absolutos (total, total_in_natura, etc.)",
    description: "Representa a contagem simples bruta de estabelecimentos encontrados na bairro. Útil para saber o volume de oferta, mas não considera o tamanho da população.",
  },
  {
    value: "ratio",
    label: "Ratio Ultra sobre Total (ratio_ultra_sobre_total)",
    description: "A porcentagem de estabelecimentos que vendem ultraprocessados em relação ao total de estabelecimentos do bairro. Quanto maior, pior a qualidade alimentar do ambiente.",
  },
  {
    value: "densidade",
    label: "Densidade por 10k hab. (densidade_..._10k)",
    description: "Número de estabelecimentos dividido pela população total do bairro, normalizado para cada 10.000 habitantes. Isso permite comparar bairros populosos com bairros pequenos de forma justa.",
  },
  {
    value: "percentil",
    label: "Percentis (percentil_densidade...)",
    description: "Um ranking de 0 a 100 que indica como este bairro se compara aos outros. Se um bairro tem 'Percentil 90' de ultraprocessados, significa que ele tem uma densidade maior do que 90% dos outros bairros do estado.",
  },
];

type ResumoGeral = {
  totais: {
    total: number
    total_in_natura: number
    total_misto: number
    total_ultraprocessado: number
  }
  percentuais: {
    in_natura: number
    misto: number
    ultraprocessado: number
  }
}

function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function fmtPct(x: number) {
  return `${Math.round(clampPct(x))}%`
}

function Donut({
  inNatura,
  misto,
  ultra,
}: {
  inNatura: number;
  misto: number;
  ultra: number;
}) {
  const a = clampPct(ultra);
  const b = clampPct(inNatura);
  const c = clampPct(misto);

  const style = useMemo(
    () =>
      ({
        background: `conic-gradient(
          var(--destructive) 0 ${a}%,
          var(--primary) ${a}% ${a + b}%,
          hsl(38 92% 50%) ${a + b}% ${a + b + c}%
        )`,
      }) as CSSProperties,
    [a, b, c]
  );

  return (
    <div className="relative h-28 w-28 rounded-full" style={style}>
      <div className="absolute inset-3 rounded-full bg-background shadow-inner" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-xs text-muted-foreground">Total</div>
        <div className="text-lg font-bold">{fmtPct(a + b + c)}</div>
      </div>
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm font-medium leading-4">{label}</div>
          {hint && (
            <div className="text-xs text-muted-foreground">{hint}</div>
          )}
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  )
}

export default function MapPage() {
  const [resumo, setResumo] = useState<ResumoGeral | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchResumo = async () => {
      setLoading(true)
      setError(null)

      try {
        const r = await fetch(`${API_BASE}/api/v1/geo/bairros/resumo`)
        if (!r.ok) throw new Error(r.statusText)
        const json = (await r.json()) as ResumoGeral
        if (!cancelled) setResumo(json)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchResumo()

    return () => {
      cancelled = true
    }
  }, [])

  const ultraPct = resumo?.percentuais.ultraprocessado ?? 0
  const inNaturaPct = resumo?.percentuais.in_natura ?? 0
  const mistoPct = resumo?.percentuais.misto ?? 0

  return (
    <>
      {/* Título Principal */}
      <div className="mx-auto mt-24 max-w-5xl p-4">
        <h1 className="text-4xl font-bold">
          Distribuição de alimentos no estado do Rio de Janeiro
        </h1>
        <h2 className="mt-1 text-sm font-light">
          Entenda a qualidade da alimentação com base no grau de processamento
          industrial, conforme o Guia Alimentar para a População Brasileira.
        </h2>
      </div>

      {/* Seção Resumo (Donut + Stats) */}
      <div className="mx-auto max-w-5xl p-4">
        <div className="rounded-2xl border bg-card/40 p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                Panorama (base atual do RAJAI)
              </div>
              <div className="text-xl font-semibold">
                Proporção de pontos por tipo de oferta
              </div>
              {loading && (
                <div className="text-xs text-muted-foreground">
                  Carregando resumo…
                </div>
              )}
              {error && (
                <div className="text-xs text-destructive">
                  Falha ao carregar: {error}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Donut
                ultra={ultraPct}
                inNatura={inNaturaPct}
                misto={mistoPct}
              />

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Ultraprocessado
                  <span className="font-semibold">
                    {fmtPct(ultraPct)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  In natura
                  <span className="font-semibold">
                    {fmtPct(inNaturaPct)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "hsl(38 92% 50%)" }}
                  />
                  Misto
                  <span className="font-semibold">
                    {fmtPct(mistoPct)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StatRow
              icon={<AlertCircle className="h-4 w-4 text-destructive" />}
              label="Ultraprocessado"
              value={fmtPct(ultraPct)}
              hint="maior presença de UP"
            />
            <StatRow
              icon={<Leaf className="h-4 w-4 text-primary" />}
              label="In natura"
              value={fmtPct(inNaturaPct)}
              hint="alimentos frescos"
            />
            <StatRow
              icon={
                <UtensilsCrossed
                  className="h-4 w-4"
                  style={{ color: "hsl(38 92% 50%)" }}
                />
              }
              label="Misto"
              value={fmtPct(mistoPct)}
              hint="oferta híbrida"
            />
          </div>

          {resumo && (
            <div className="mt-3 text-xs text-muted-foreground">
              Total de registros agregados:{" "}
              <span className="font-medium">
                {resumo.totais.total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Seção Mapa e Glossário */}
      <div className="max-w-6xl p-4 mx-auto mt-4 flex flex-col gap-4">

        {/* Cabeçalho da Seção do Mapa com Botão do Glossário */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-bold">Mapa coroplético</h2>
            <p className="text-sm font-light text-muted-foreground max-w-2xl">
              Visualize densidades por processamento e contraste vulnerabilidades por bairro.
              Utilize o seletor no mapa para alternar as métricas.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <BookOpen className="h-4 w-4" />
                Entenda as métricas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Glossário de Métricas</DialogTitle>
                <DialogDescription>
                  Entenda o significado de cada opção disponível no seletor do mapa.
                </DialogDescription>
              </DialogHeader>

              <Accordion type="single" collapsible className="w-full">
                {glossaryItems.map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger className="text-left font-semibold">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.description}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </DialogContent>
          </Dialog>
        </div>

        {/* O Mapa */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <Mapa />
        </div>
      </div>
    </>
  );
}