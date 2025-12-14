import { useMemo, useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatbotSkeleton, type ChatMessage } from "@/components/chabotSkeleton"
import { ExportRelatorios } from "@/components/exportRelatorios"
import { Button, Stack, Typography } from "@mui/material"

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL ?? import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"

const RELATORIO_PROMPT = `
Você é o gerador de relatórios do RAJAI.
- Idioma: português do Brasil, conciso e executivo.
- Escopo: métricas por bairro do RJ (in natura, misto, ultraprocessado), hubs, rotas logísticas.
- Formatos de saída: texto estruturado + blocos para exportar (CSV para XLSX, Markdown para PDF).
- Sempre que o usuário pedir PDF/XLSX, devolva:
  1) Resumo em bullets (3-6 bullets)
  2) Tabela em Markdown (| col | ... |) e um bloco CSV marcado com \`\`\`csv para fácil export.
- Se faltar dado, explique suposições e próximos passos (qual endpoint/arquivo coletar).
`

function formatHistory(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role === "user" ? "Usuário" : "Relatórios"}: ${m.text}`).join("\n")
}

export default function RelatorioAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "relatorio-welcome",
      role: "assistant",
      text: "Posso gerar um relatório (PDF/XLSX) com métricas por bairro e rotas. Diga o escopo (bairros, período, formato).",
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const [lastAssistantText, setLastAssistantText] = useState("")

  const disabled = !GEMINI_API_KEY

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isSending) return

    // Se estamos aguardando confirmação e o usuário digitar "sim"/"gerar", só libera export.
    if (awaitingConfirm && !showExport) {
      const lc = content.toLowerCase()
      const wantsExport = ["sim", "pode gerar", "gerar", "gera", "ok", "pode exportar"].some((k) =>
        lc.includes(k)
      )
      if (wantsExport) {
        setShowExport(true)
        setAwaitingConfirm(false)
        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text: content }])
        setInput("")
        return
      }
    }

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", text: content }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    setShowExport(false)
    setAwaitingConfirm(false)

    if (disabled) {
      setMessages((prev) => [
        ...prev,
        {
          id: `relatorio-error-${Date.now()}`,
          role: "assistant",
          text: "Configure a variável GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) para que eu possa gerar o relatório.",
        },
      ])
      return
    }

    setIsSending(true)
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
${RELATORIO_PROMPT}

Histórico:
${formatHistory(nextMessages)}

Usuário: ${content}
Relatórios:
`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      setMessages((prev) => [...prev, { id: `relatorio-${Date.now()}`, role: "assistant", text }])
      setLastAssistantText(text)
      setShowExport(false)
      setAwaitingConfirm(true)
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Erro inesperado ao gerar resposta."
      setMessages((prev) => [
        ...prev,
        {
          id: `relatorio-error-${Date.now()}`,
          role: "assistant",
          text: `Não consegui gerar agora: ${messageText}`,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (disabled) return "Configure GEMINI_API_KEY para ativar a geração de relatórios."
    return "Gere PDF/XLSX com métricas por bairro e desempenho logístico."
  }, [disabled])

  return (
    <Stack spacing={2}>
      <ChatbotSkeleton
        title="Relatórios RAJAI"
        subtitle={subtitle}
        messages={messages}
        inputValue={input}
        onInputChange={setInput}
        onSend={handleSend}
        isSending={isSending}
        placeholder="Ex.: PDF com top 10 bairros UP vs in natura, ou CSV de rotas e custos..."
        renderAfterAssistant={(msg) =>
          msg.id !== "relatorio-welcome" && awaitingConfirm ? (
            <Stack spacing={1} sx={{ pl: 5 }}>
              {!showExport ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">
                    Deseja gerar o relatório ou ajustar a solicitação?
                  </Typography>
                  <Button variant="contained" size="small" onClick={() => setShowExport(true)} disabled={disabled}>
                    Gerar relatório
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setShowExport(false)}>
                    Ajustar / Perguntar
                  </Button>
                </Stack>
              ) : null}
              {showExport ? (
                <ExportRelatorios
                  title="Relatório RAJAI"
                  content={lastAssistantText || msg.text}
                  fileBaseName="relatorio-rajai"
                  disabled={disabled}
                />
              ) : null}
            </Stack>
          ) : null
        }
      />
    </Stack>
  )
}
