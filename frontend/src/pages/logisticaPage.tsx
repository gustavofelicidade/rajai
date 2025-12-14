import { LogisticaPanel } from "@/components/logistica"

export default function LogisticaPage() {
  return (
    <div className="max-w-6xl p-4 mx-auto mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold">Rotas logísticas (IA)</h1>
        <h2 className="text-sm font-light">
          Heurística inicial de vizinho mais próximo entre produtores/cooperativas e bairros prioritários. Em breve,
          solver mais robusto.
        </h2>
      </div>
      <LogisticaPanel />
    </div>
  )
}
