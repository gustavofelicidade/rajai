import type { ComponentType } from "react"
import { Button } from "@/components/ui/button"
import { Bot, FileSpreadsheet, Leaf, MessagesSquare } from "lucide-react"
import { Link } from "react-router-dom"

type AgentCard = {
  id: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  cta?: string
  href?: string
}

const agents: AgentCard[] = [
  {
    id: "relatorio",
    title: "Geração de relatórios",
    description: "Exporta PDF e XLSX com métricas chave por bairro e desempenho logístico.",
    icon: FileSpreadsheet,
    cta: "Exportar",
  },
  {
    id: "biopora",
    title: "Chat Bioporã",
    description: "Especialista em alimentação viva para apoiar recomendações e cardápios.",
    icon: Leaf,
    cta: "Conversar",
    href: "/mapa/agentes/biopora",
  },
  {
    id: "geral",
    title: "Chat geral Rajai",
    description: "Assistente amplo para dúvidas sobre dados, mapas e operação no RJ.",
    icon: MessagesSquare,
    cta: "Abrir chat",
    href: "/mapa/agentes/rajai",
  },
]

export default function AgentesPage() {
  return (
    <div className="max-w-5xl p-4 mx-auto mt-4 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Agentes Rajai</h1>
          <p className="text-sm text-muted-foreground">Escolha um agente para continuar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon
          return (
            <div key={agent.id} className="rounded-xl border p-4 flex flex-col gap-3 bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="font-semibold">{agent.title}</div>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{agent.description}</p>
              {agent.href ? (
                <Button variant="outline" asChild>
                  <Link to={agent.href}>{agent.cta ?? "Abrir"}</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {agent.cta ?? "Em breve"}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
