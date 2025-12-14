import { useMemo, useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatbotSkeleton, type ChatMessage } from "@/components/chabotSkeleton"

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL ?? import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"

const ANALISADOR_PROMPT = `
Você é o analista de dados locais do RAJAI.
- Foco: dados de bairros do RJ (in natura, misto, ultraprocessado), densidade, percentis, hotspots.
- Responda em português, com 2–4 bullets claros; se tabelar, use Markdown e bloco CSV para exportação.
- Quando perguntarem "top/bottom" ou "mapa", devolva listas com bairro e métrica; sugira próximos passos (filtro, corte temporal).
- Se não houver dado, explique como coletar (endpoint /api/v1/geo/bairros/...).
`

function formatHistory(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role === "user" ? "Usuário" : "Analista"}: ${m.text}`).join("\n")
}

export default function AnalisadorDadosLocaisAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "analisa-welcome",
      role: "assistant",
      text: "Sou o Analista de Dados Locais. Pergunte por rankings de bairros, hotspots de UP ou exportações CSV.",
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
          id: `analisa-error-${Date.now()}`,
          role: "assistant",
          text: "Configure GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) para ativar o analista.",
        },
      ])
      return
    }

    setIsSending(true)
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
${ANALISADOR_PROMPT}

Histórico:
${formatHistory(nextMessages)}

Usuário: ${content}
Analista:
`
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      setMessages((prev) => [...prev, { id: `analisa-${Date.now()}`, role: "assistant", text }])
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Erro inesperado."
      setMessages((prev) => [
        ...prev,
        { id: `analisa-error-${Date.now()}`, role: "assistant", text: `Não consegui responder: ${messageText}` },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (disabled) return "Configure GEMINI_API_KEY para ativar."
    return "Analisa dados locais, rankings e exportações CSV."
  }, [disabled])

  return (
    <ChatbotSkeleton
      title="Analista de Dados Locais"
      subtitle={subtitle}
      messages={messages}
      inputValue={input}
      onInputChange={setInput}
      onSend={handleSend}
      isSending={isSending}
      placeholder="Ex.: top 10 bairros por densidade de UP, ou CSV com percentis..."
    />
  )
}
