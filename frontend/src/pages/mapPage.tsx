import { Mapa } from "@/components/mapa";
import { AlertCircle, Leaf } from "lucide-react";

export default function MapPage() {
  return (
    <>
      <div className="max-w-5xl p-4 mx-auto">
        <h1 className="text-4xl font-bold">Distribuição de alimentos no estado do Rio de Janeiro</h1>
        <h2 className="text-sm font-light mt-1">Entenda a qualidade da sua alimentação baseada no grau de processamento industrial, conforme diretrizes do Guia Alimentar para a População Brasileira.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto p-4 gap-4">
        <div className="shadow rounded-xl border-foreground/40 p-4">
          <div className="flex gap-1 text-red-600"> <AlertCircle /> <span>Processado</span> </div>
          <div className="flex justify-end text-3xl font-bold">32%</div>
        </div>
        <div className="shadow rounded-xl border-foreground/40 p-4">
          <div className="flex gap-1 text-green-600"> <Leaf /> <span>In Natura</span> </div>
          <div className="flex justify-end text-3xl font-bold">8%</div>
        </div>
        <div className="shadow rounded-xl border-foreground/40 p-4">
          <div className="flex gap-1 text-amber-600"> <AlertCircle /> <span>Misto</span> </div>
          <div className="flex justify-end text-3xl font-bold">60%</div>
        </div>
      </div>

      <div className="mt-4 max-w-5xl mx-auto p-4 overflow-hidden">
        <Mapa />
      </div>
    </>
  )
}