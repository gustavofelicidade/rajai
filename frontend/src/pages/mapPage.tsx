import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"

import { Mapa } from "@/components/mapa";
import { AlertCircle, Leaf, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

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
      {/* Header */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-center bg-primary">
        <img src="/logo.svg" alt="Logo" className="h-12" />
      </header>

      {/* Título */}
      <div className="mx-auto mt-24 max-w-5xl p-4">
        <h1 className="text-4xl font-bold">
          Distribuição de alimentos no estado do Rio de Janeiro
        </h1>
        <h2 className="mt-1 text-sm font-light">
          Entenda a qualidade da alimentação com base no grau de processamento
          industrial, conforme o Guia Alimentar para a População Brasileira.
        </h2>
      </div>

      {/* Resumo */}
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

      <div className="max-w-6xl p-4 mx-auto mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-bold">Mapa coroplético por processamento</h2>
          <p className="text-sm font-light">
            Visualize densidades por processamento e contraste vulnerabilidades por bairro.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Mapa />
        </div>
      </div>
    </>
  );
}
