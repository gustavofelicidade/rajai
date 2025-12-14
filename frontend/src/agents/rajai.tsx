import { useMemo, useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatbotSkeleton, type ChatMessage } from "@/components/chabotSkeleton"

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL ?? import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"

const RAJAI_PROMPT = `
Você é o Rajai, assistente geral da plataforma RAJAI (rotas logísticas, mapas, dados de alimentação no RJ).
- Responda em português, tom direto e cordial.
- Foque no estado do Rio de Janeiro, bairros e operação logística/dados da plataforma.
- Seja conciso: 2–4 parágrafos ou bullets curtos.
- Se não tiver dado local, explique limitações e proponha próximos passos.
`

function formatHistory(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role === "user" ? "Usuário" : "Rajai"}: ${m.text}`).join("\n")
}

export default function RajaiAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "rajai-welcome",
      role: "assistant",
      text: "Oi, eu sou o Rajai. Posso ajudar sobre dados, mapas ou rotas no RJ. Qual a sua dúvida?",
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
          id: `rajai-error-${Date.now()}`,
          role: "assistant",
          text: "Configure a variável GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) para que eu possa responder.",
        },
      ])
      return
    }

    setIsSending(true)
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
${RAJAI_PROMPT}

Histórico:
${formatHistory(nextMessages)}

Usuário: ${content}
Rajai:
`
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      setMessages((prev) => [...prev, { id: `rajai-${Date.now()}`, role: "assistant", text }])
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Erro inesperado ao gerar resposta."
      setMessages((prev) => [
        ...prev,
        {
          id: `rajai-error-${Date.now()}`,
          role: "assistant",
          text: `Não consegui responder agora: ${messageText}`,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (disabled) return "Configure GEMINI_API_KEY para ativar o chat."
    return "Assistente geral para dados, mapas e operação RAJAI no RJ."
  }, [disabled])

  return (
    <ChatbotSkeleton
      title="Rajai — chat geral"
      subtitle={subtitle}
      messages={messages}
      inputValue={input}
      onInputChange={setInput}
      onSend={handleSend}
      isSending={isSending}
      placeholder="Pergunte sobre mapas, dados ou rotas no RJ..."
    />
  )
}
