import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full min-h-[75vh] lg:h-screen overflow-hidden">
        <img
          src="/hero.gif"
          alt="Fundo animado - Semana da Computação 2025"
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
          aria-hidden="true"
        />

        <div className="absolute inset-0 bg-linear-to-b from-white/50 via-white/40 to-white/60 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-transparent border-0 p-6 md:p-10 rounded-2xl">
                <div className="text-center">
                  <img src="/logo.svg" alt="logo " />
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold sr-only">
                    RAJAI
                  </h1>
                  <p className="text-md sm:text-lg lg:text-xl">
                    Veja como é a distribuição de alimentos no Rio de Janeiro
                  </p>

                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button asChild aria-label="Visualizar mapa">
                      <Link
                        to="/mapa"
                        className="px-6 py-3"
                      >
                        Visualizar mapa
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-4 space-y-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              O que é o RAJAI?
            </h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              O RAJAI é um <strong>centro de informações sobre a distribuição de alimentos no Rio de Janeiro</strong>.
              Nosso objetivo é centralizar dados e oferecer visualizações claras sobre os sistemas alimentares,
              auxiliando na criação de políticas públicas mais assertivas.
            </p>
          </div>

          <hr className="border-gray-200" />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Conceitos Importantes</h2>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">Deserto Alimentar</h3>
                <p className="text-gray-700">
                  Áreas onde o acesso a alimentos saudáveis e <em>in natura</em> é escasso.
                  Moradores dessas regiões precisam percorrer grandes distâncias para encontrar comida de verdade.
                </p>
                <a href="https://www.camara.leg.br/noticias/754736-estudo-mostra-que-desertos-alimentares-atingem-areas-perifericas/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Fonte: Câmara dos Deputados
                </a>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">Pântano Alimentar</h3>
                <p className="text-gray-700">
                  Regiões com abundância de alimentos ultraprocessados, ricos em calorias e pobres em nutrientes.
                  Aqui, a comida não saudável é a opção mais fácil e barata.
                </p>
                <a href="https://ojoioeotrigo.com.br/2020/10/pantanos-alimentares/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Fonte: O Joio e O Trigo
                </a>
              </div>
            </div>

            <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/X2djTOkLNHY"
                title="Vídeo sobre Desertos Alimentares"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100 order-2 md:order-1">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/5gyTL7vqwMA"
                title="Vídeo sobre Ultraprocessados"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900">Fome e Ultraprocessados</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                A fome moderna muitas vezes se esconde atrás do consumo de calorias vazias. Mesmo quando há acesso à comida, ela é majoritariamente composta por <strong>alimentos ultraprocessados</strong>. Fatores como a falta de tempo e o preço elevado de alimentos frescos acabam empurrando os cariocas para um ciclo de má nutrição e doenças crônicas, onde a falta de nutrientes essenciais coexiste com o excesso de peso.
              </p>
              <a href="https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-alimentar-melhor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-medium">
                <FileText className="h-4 w-4" />
                Saiba mais no Ministério da Saúde
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
