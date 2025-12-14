import Chatbot from "@/components/chatbot";

export default function ChatbotPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Converse com os dados</h1>
      <p className="mb-4">
        Faça perguntas sobre a distribuição de alimentos no Rio de Janeiro e
        obtenha insights diretamente do seu navegador.
      </p>
      <Chatbot />
    </div>
  );
}
