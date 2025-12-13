import { Separator } from "@radix-ui/react-separator"
import { Sprout, Map, Database, FileText, Info, ShieldCheck, Mail } from "lucide-react"


export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-4">
      <div className="container mx-auto px-4 py-10 md:py-12 lg:px-8">

        {/* Grid Principal */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">

          {/* BLOCO 1: Identidade (Ocupa 5 colunas no desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              {/* Ícone representando a Logo Geométrica */}
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                RAJAI
              </span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Rede de Acesso Justo a Alimentos e Informação.
              <br />
              Um sistema de inteligência territorial para guiar políticas públicas de segurança alimentar e nutricional.
            </p>

            {/* Contato direto (sem input, apenas informativo) */}
            <div className="flex items-center gap-2 text-sm font-medium text-foreground pt-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href="mailto:contato@rajai.gov.br" className="hover:text-primary transition-colors">
                falecom@rajai.gov.br
              </a>
            </div>
          </div>

          {/* Espaçador (Ocupa 1 coluna) */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* BLOCO 2: Navegação (Ocupa 6 colunas, dividido em 2 listas) */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-6">

            {/* Coluna A: O Sistema */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wide text-foreground">
                Plataforma
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="/mapa" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Map className="h-3.5 w-3.5" /> Mapa de Dados
                  </a>
                </li>
                <li>
                  <a href="/indicadores" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Database className="h-3.5 w-3.5" /> Indicadores
                  </a>
                </li>
                <li>
                  <a href="/relatorios" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Relatórios Técnicos
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna B: Institucional */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wide text-foreground">
                Institucional
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="/sobre" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Info className="h-3.5 w-3.5" /> Sobre o Projeto
                  </a>
                </li>
                <li>
                  <a href="/metodologia" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <ShieldCheck className="h-3.5 w-3.5" /> Metodologia e Privacidade
                  </a>
                </li>
                <li>
                  <a href="/documentacao" className="hover:text-primary transition-colors pl-5.5">
                    Documentação da API
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Rodapé Inferior: Copyright e Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} RAJAI. Desenvolvido para apoio à decisão pública.</p>
          <div className="flex gap-6">
            <a href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">Política de Dados</a>
            <a href="/acessibilidade" className="hover:text-foreground transition-colors">Acessibilidade</a>
          </div>
        </div>
      </div>
    </footer>
  )
}