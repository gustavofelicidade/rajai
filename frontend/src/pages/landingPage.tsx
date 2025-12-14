import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPinned, ShieldCheck, BookOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative w-full min-h-[85vh] lg:min-h-screen overflow-hidden">
      {/* Background */}
      <img
        src="/hero.gif"
        alt="Fundo ilustrativo"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/50 to-white/80" />

      {/* Top bar */}
      <div className="relative z-10">
        <header className="w-full">
          <div className="mx-auto max-w-6xl px-4 pt-6 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="RAJAI" className="h-10" />
              <span className="sr-only">RAJAI</span>
            </a>

            <nav className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <a href="/mapa">Mapa</a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/login">Entrar</a>
              </Button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <main className="mx-auto max-w-6xl px-4 pt-10 pb-10 lg:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                RAJAI
              </h1>

              <p className="mt-4 text-base sm:text-lg text-foreground/80 leading-relaxed">
                Rede de Acesso Justo à Alimentação e Informação. Um painel para
                explorar a distribuição de pontos de acesso a alimentos e apoiar
                decisões com base em dados.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button asChild className="h-11 px-6">
                  <a href="/mapa" aria-label="Abrir o mapa">
                    Visualizar mapa <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>

                <Button variant="outline" asChild className="h-11 px-6">
                  <a href="/login" aria-label="Entrar no sistema">
                    Entrar no sistema
                  </a>
                </Button>
              </div>

              <p className="mt-3 text-xs text-foreground/60">
                Dica: no mapa você pode trocar a métrica e clicar nos bairros para ver detalhes.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="backdrop-blur-sm bg-white/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPinned className="h-4 w-4" />
                    Mapa por bairro
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/75 leading-relaxed">
                  Visualize a distribuição e compare territórios rapidamente com uma
                  leitura geográfica intuitiva.
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Transparência
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/75 leading-relaxed">
                  Deixe claro o que é fonte, o que é metodologia e quais limites os
                  dados têm — isso aumenta confiança.
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/70 sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Camada narrativa
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/75 leading-relaxed">
                  O mapa é o “o quê”. A narrativa explica o “por quê”: desigualdade,
                  acesso, preço, tempo de deslocamento e justiça social na alimentação.
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10">
          <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-foreground/60 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} RAJAI</span>
            <span>Desenvolvido para apoio à decisão pública.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}