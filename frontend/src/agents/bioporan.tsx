import { useMemo, useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"

import { ChatbotSkeleton, type ChatMessage } from "@/components/chabotSkeleton"

import receitasText from "@/assets/receitas.txt?raw"

const vivaTexts = import.meta.glob("@/assets/alimentacao_viva/*.txt", {
  eager: true,
  import: "default",
  query: "?raw",
})

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL ?? import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"

const BIOPORAN_PROMPT = `
Você é o Bioporã, especialista em alimentação viva, germinação de sementes e culinária vegetal crua.

Princípios:
- Fale em português do Brasil, tom acolhedor e pragmático.
- Prefira recomendações simples, com ingredientes acessíveis e passo a passo claro.
- Quando sugerir receitas, cite nome, ingredientes principais e preparo curto.
- Sempre respeite restrições: se o usuário mencionar alergias, evite esses itens e proponha substituições.
- Não invente dados: baseie-se nos textos de alimentação viva e receitas fornecidos.
- Seja breve: respostas de 2–5 parágrafos ou bullets curtos.
`

const corpus = Object.values(vivaTexts)
  .map((text) => text as string)
  .concat(receitasText)
  .join("\n\n")

const CORPUS_SNIPPET = corpus.slice(0, 12000)

function formatHistory(messages: ChatMessage[]) {
  return messages
    .map((m) => `${m.role === "user" ? "Usuário" : "Bioporã"}: ${m.text}`)
    .join("\n")
}

export default function BioporanAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bio-welcome",
      role: "assistant",
      text: "Olá, eu sou o Bioporã. Posso ajudar com alimentação viva, germinação e receitas sem fogão. O que você precisa?",
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
          id: `bio-error-${Date.now()}`,
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
${BIOPORAN_PROMPT}

Trechos de referência (receitas e capítulos de alimentação viva):
${CORPUS_SNIPPET}

Histórico:
${formatHistory(nextMessages)}

Usuário: ${content}
Bioporã:
`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      setMessages((prev) => [...prev, { id: `bio-${Date.now()}`, role: "assistant", text }])
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Erro inesperado ao gerar resposta."
      setMessages((prev) => [
        ...prev,
        {
          id: `bio-error-${Date.now()}`,
          role: "assistant",
          text: `Não consegui responder agora: ${messageText}`,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (disabled) return "Configure VITE_GEMINI_API_KEY para ativar o chat."
    return "Especialista em alimentação viva, germinação e receitas cruas."
  }, [disabled])

  return (
    <ChatbotSkeleton
      title="Bioporã — alimentação viva"
      subtitle={subtitle}
      messages={messages}
      inputValue={input}
      onInputChange={setInput}
      onSend={handleSend}
      isSending={isSending}
      placeholder="Pergunte sobre germinação, substituições, receitas sem fogão..."
    />
  )
}
