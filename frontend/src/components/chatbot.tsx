
import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-pro";

type Message = {
  text: string;
  isUser: boolean;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to check for API Key and set initial error if missing
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      setError("Atenção: A chave da API do Gemini (VITE_GEMINI_API_KEY) não está configurada. O chatbot não funcionará.");
    }
  }, []);

  // Effect to scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle the form submission to send a message
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !GEMINI_API_KEY) {
      return;
    }

    const userMessage: Message = { text: input, isUser: true };
    setMessages([userMessage]); // Clear previous messages and show the new user message
    setInput("");
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // Initialize Gemini AI with the environment variable key
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = [
        "Você é o Raj.AI, um assistente virtual especialista em segurança alimentar e distribuição de alimentos no estado do Rio de Janeiro.",
        "Seu conhecimento é estritamente focado no Rio de Janeiro. Se perguntarem sobre outros locais, responda educadamente que você só possui informações sobre o Rio de Janeiro.",
        "Você deve basear suas respostas em seu conhecimento sobre os seguintes tópicos:",
        "1.  **Desertos e Oásis Alimentares:** Conceitos e a aplicação deles na geografia do Rio de Janeiro.",
        "2.  **Classificação NOVA:** A diferença entre alimentos 'in natura', 'minimamente processados', 'processados' e 'ultraprocessados'.",
        "3.  **Distribuição de Alimentos:** Como a disponibilidade de diferentes tipos de alimentos (in natura vs. ultraprocessados) varia entre bairros e regiões do estado.",
        "4.  **Impacto Socioeconômico:** A relação entre renda, acesso a alimentos saudáveis e a prevalência de doenças relacionadas à má alimentação.",
        "Seja amigável, didático e direto em suas respostas. Finja ter esse conhecimento, mesmo que precise usar sua base de dados geral para inferir a situação no Rio de Janeiro.",
        "Não mencione que você é um modelo de linguagem ou que está 'fingindo'. Aja como um verdadeiro especialista.",
        `**Pergunta do usuário:** "${input}"`,
        "**Sua resposta:**"
      ].join('\n');

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const botMessage: Message = { text, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : typeof error === "string" ? error : "Erro inesperado";
      console.error("Error generating content:", error);
      const errorMessageText = `Desculpe, ocorreu um erro: ${messageText}. Verifique se sua chave de API é válida e se o modelo '${GEMINI_MODEL}' está acessível.`;
      setError(errorMessageText); // Set error state to display in the UI
      const errorMessage: Message = {
        text: errorMessageText,
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 h-[700px] flex flex-col bg-card">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto pr-4 pt-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
                  }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md p-3 rounded-lg bg-muted">
                <p className="text-sm">Pensando...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={!GEMINI_API_KEY ? "Aguardando configuração da API Key..." : "Digite sua mensagem..."}
          className="flex-1"
          disabled={isLoading || !GEMINI_API_KEY}
        />
        <Button type="submit" size="icon" disabled={isLoading || !GEMINI_API_KEY}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
