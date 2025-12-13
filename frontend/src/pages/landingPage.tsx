import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const ticketUrl = "/hero.gif";

  return (
    <div className="relative w-full min-h-[75vh] lg:h-screen overflow-hidden">
      <img
        src="/hero.gif"
        alt="Fundo animado - Semana da Computa��o 2025"
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
                  Sistema de auxilio à politicas publicas, concentrando dados e apresentações de sistemas alimentares.
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild aria-label="Garanta seu ingresso">
                    <a
                      href={ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3"
                    >
                      Ver gáficos
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    asChild
                    aria-label="Saiba mais sobre programa��o"
                  >
                    <a href="/login" className="px-6 py-3">
                      entrar no sistema
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}