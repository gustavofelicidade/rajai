import { useMemo, useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatbotSkeleton, type ChatMessage } from "@/components/chabotSkeleton"

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL ?? import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"

const ONBOARDING_PROMPT = `
Você é o agente de onboarding de produtores/cooperativas do RAJAI.
- Objetivo: coletar dados (nome, contato, endereço, lat/lon, capacidade, janelas de coleta, tipos de produto) e validar consistência.
- Tom: cordial e prático; 2–4 bullets; peça campos faltantes claramente.
- Devolva um bloco CSV com colunas recomendadas (id,nome,bairro,lat,lon,capacidade,janela_coleta,produtos) para facilitar import.
- Se o usuário não souber lat/lon, instrua a pegar via Google Maps ou CEP aproximado.
`

function formatHistory(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role === "user" ? "Usuário" : "Onboarding"}: ${m.text}`).join("\n")
}

export default function OnboardingProdutoresAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "onb-welcome",
      role: "assistant",
      text: "Vamos cadastrar produtores/cooperativas. Informe nome, bairro, contato e janelas de coleta.",
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
          id: `onb-error-${Date.now()}`,
          role: "assistant",
          text: "Configure GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) para ativar o onboarding.",
        },
      ])
      return
    }

    setIsSending(true)
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
${ONBOARDING_PROMPT}

Histórico:
${formatHistory(nextMessages)}

Usuário: ${content}
Onboarding:
`
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      setMessages((prev) => [...prev, { id: `onb-${Date.now()}`, role: "assistant", text }])
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Erro inesperado."
      setMessages((prev) => [
        ...prev,
        { id: `onb-error-${Date.now()}`, role: "assistant", text: `Não consegui responder: ${messageText}` },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (disabled) return "Configure GEMINI_API_KEY para ativar."
    return "Coleta dados de produtores/cooperativas e gera CSV de importação."
  }, [disabled])

  return (
    <ChatbotSkeleton
      title="Onboarding de Produtores"
      subtitle={subtitle}
      messages={messages}
      inputValue={input}
      onInputChange={setInput}
      onSend={handleSend}
      isSending={isSending}
      placeholder="Ex.: Cadastrar cooperativa de Bangu, coleta seg/qua 8-12h, capacidade 2t..."
    />
  )
}
