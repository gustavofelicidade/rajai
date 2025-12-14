import { useMemo, useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatbotSkeleton, type ChatMessage } from "@/components/chabotSkeleton"

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL ?? import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"

const ROTEIRISTA_PROMPT = `
Você é o roteirista logístico do RAJAI.
- Foco: produtores, hubs, bairros-alvo, custos e distâncias.
- Responda em português, 2–4 bullets objetivos, sugerindo rotas candidatas e trade-offs (custo vs. tempo).
- Sempre que possível, devolva um CSV simples (origem,destino,dist_km,custo) em bloco \`\`\`csv.
- Se faltar dado, indique quais parâmetros pedir (coordenadas, demanda, capacidade do veículo).
`

function formatHistory(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role === "user" ? "Usuário" : "Roteirista"}: ${m.text}`).join("\n")
}

export default function RoteiristaLogisticoAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "roteirista-welcome",
      role: "assistant",
      text: "Sou o Roteirista Logístico. Diga origem, hubs e destinos para sugerir rotas e custos.",
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const disabled = !GEMINI_API_KEY

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isSending) return

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", text: content }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")

    if (disabled) {
      setMessages((prev) => [
        ...prev,
        {
          id: `roteirista-error-${Date.now()}`,
          role: "assistant",
          text: "Configure GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) para ativar o roteirista.",
        },
      ])
      return
    }

    setIsSending(true)
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
${ROTEIRISTA_PROMPT}

Histórico:
${formatHistory(nextMessages)}

Usuário: ${content}
Roteirista:
`
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      setMessages((prev) => [...prev, { id: `roteirista-${Date.now()}`, role: "assistant", text }])
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Erro inesperado."
      setMessages((prev) => [
        ...prev,
        { id: `roteirista-error-${Date.now()}`, role: "assistant", text: `Não consegui responder: ${messageText}` },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (disabled) return "Configure GEMINI_API_KEY para ativar."
    return "Sugere rotas, custos e CSV para exportar."
  }, [disabled])

  return (
    <ChatbotSkeleton
      title="Roteirista Logístico"
      subtitle={subtitle}
      messages={messages}
      inputValue={input}
      onInputChange={setInput}
      onSend={handleSend}
      isSending={isSending}
      placeholder="Ex.: rotas de Campo Grande para CEASA e Bangu, custo estimado..."
    />
  )
}
