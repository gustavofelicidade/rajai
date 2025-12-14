<<<<<<< Updated upstream
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { Mapa } from "@/components/mapa";
import { AlertCircle, Leaf, UtensilsCrossed } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

type ResumoGeral = {
  totais: {
    total: number;
    total_in_natura: number;
    total_misto: number;
    total_ultraprocessado: number;
  };
  percentuais: {
    in_natura: number;
    misto: number;
    ultraprocessado: number;
  };
};

function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function fmtPct(x: number) {
  return `${Math.round(clampPct(x))}%`;
}

function Donut({ inNatura, misto, ultra }: { inNatura: number; misto: number; ultra: number }) {
  const a = clampPct(ultra);
  const b = clampPct(inNatura);
  const c = clampPct(misto);

  // Conic gradient: 1) ultraprocessado, 2) in natura, 3) misto
  const style = useMemo(
    () =>
      ({
        background: `conic-gradient(var(--destructive) 0 ${a}%, var(--primary) ${a}% ${a + b}%, hsl(38 92% 50%) ${a + b}% 100%)`,
      }) as CSSProperties,
    [a, b]
  );

  return (
    <div className="relative h-28 w-28 rounded-full" style={style}>
      <div className="absolute inset-3 rounded-full bg-background shadow-inner" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-xs text-muted-foreground">Total</div>
        <div className="text-lg font-bold">{fmtPct(a + b + c === 0 ? 0 : 100)}</div>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm font-medium leading-4">{label}</div>
          {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
=======
import { Mapa } from "@/components/mapa"
import { AlertCircle, Leaf } from "lucide-react"
>>>>>>> Stashed changes

export default function MapPage() {
  const [resumo, setResumo] = useState<ResumoGeral | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/v1/geo/bairros/resumo`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((json: ResumoGeral) => {
        if (cancelled) return;
        setResumo(json);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ultraPct = resumo?.percentuais.ultraprocessado ?? 0;
  const inNaturaPct = resumo?.percentuais.in_natura ?? 0;
  const mistoPct = resumo?.percentuais.misto ?? 0;

  return (
    <>
<<<<<<< Updated upstream
      <header className="bg-primary flex items-center justify-center absolute top-0 w-full">
        <img src="/logo.svg" alt="logo" className="h-12" />
      </header>

      <div className="max-w-5xl p-4 mx-auto mt-32">
        <h1 className="text-4xl font-bold">Distribuição de alimentos no estado do Rio de Janeiro</h1>
        <h2 className="text-sm font-light mt-1">Entenda a qualidade da sua alimentação baseada no grau de processamento industrial, conforme diretrizes do Guia Alimentar para a População Brasileira.</h2>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        <div className="rounded-2xl border bg-card/40 p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Panorama (base atual do RAJAI)</div>
              <div className="text-xl font-semibold">Proporção de pontos por tipo de oferta</div>
              {loading ? <div className="text-xs text-muted-foreground">Carregando resumo…</div> : null}
              {error ? <div className="text-xs text-destructive">Falha ao carregar: {error}</div> : null}
            </div>

            <div className="flex items-center gap-4">
              <Donut inNatura={inNaturaPct} misto={mistoPct} ultra={ultraPct} />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Ultraprocessado</span>
                  <span className="font-semibold tabular-nums">{fmtPct(ultraPct)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">In natura</span>
                  <span className="font-semibold tabular-nums">{fmtPct(inNaturaPct)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(38 92% 50%)" }} />
                  <span className="text-muted-foreground">Misto</span>
                  <span className="font-semibold tabular-nums">{fmtPct(mistoPct)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
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
              icon={<UtensilsCrossed className="h-4 w-4" style={{ color: "hsl(38 92% 50%)" }} />}
              label="Misto"
              value={fmtPct(mistoPct)}
              hint="oferta híbrida"
            />
          </div>

          {resumo ? (
            <div className="mt-3 text-xs text-muted-foreground">
              Total de registros agregados: <span className="font-medium tabular-nums">{resumo.totais.total}</span>
            </div>
          ) : null}
        </div>
      </div>
=======
      <div className="max-w-6xl p-4 mx-auto mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold">Mapa coroplético por processamento</h1>
          <h2 className="text-sm font-light">
            Visualize densidades por processamento e contraste vulnerabilidades por bairro.
          </h2>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="shadow rounded-xl border-foreground/40 p-4">
              <div className="flex gap-1 text-red-600">
                <AlertCircle /> <span>Processado</span>
              </div>
              <div className="flex justify-end text-3xl font-bold">32%</div>
            </div>
            <div className="shadow rounded-xl border-foreground/40 p-4">
              <div className="flex gap-1 text-green-600">
                <Leaf /> <span>In Natura</span>
              </div>
              <div className="flex justify-end text-3xl font-bold">8%</div>
            </div>
            <div className="shadow rounded-xl border-foreground/40 p-4">
              <div className="flex gap-1 text-amber-600">
                <AlertCircle /> <span>Misto</span>
              </div>
              <div className="flex justify-end text-3xl font-bold">60%</div>
            </div>
          </div>
>>>>>>> Stashed changes

          <div className="overflow-hidden rounded-xl border">
            <Mapa />
          </div>
        </div>
      </div>
    </>
  )
}
