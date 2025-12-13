import Button from '../atoms/Button'
import Pill from '../atoms/Pill'
import StatCard from '../molecules/StatCard'

const Hero = () => {
  return (
    <section className="section hero">
      <div className="hero__grid">
        <div className="hero__content">
          <Pill label="Inclusão digital + cadeia curta" tone="success" />
          <h1>RAJA: Rede de Acesso Justo a Alimentos</h1>
          <p className="hero__lead">
            Plataforma web/mobile que corrige a desarticulação histórica entre produção e consumo.
            Usamos IA para mapear desertos alimentares, prever demanda e conectar agricultura familiar a
            pontos de distribuição em subdistritos com pior acesso.
          </p>
          <div className="hero__actions">
            <Button variant="primary">Explorar mapa de vulnerabilidade</Button>
            <Button variant="ghost">Ver modelo Lean Canvas</Button>
          </div>
          <div className="hero__meta">
            <span>Percentil 25 dos estabelecimentos saudáveis como ponto de partida da expansão.</span>
            <span>Dados abertos: POF, CNEFE, malha urbana do Rio e sinais de renda.</span>
          </div>
        </div>

        <div className="hero__panel">
          <div className="hero__panel-title">
            <Pill label="IA orquestrada" tone="muted" />
            <span>Langgraph + Gemini 2.5 Flash</span>
          </div>
          <div className="hero__highlight">
            <span className="section-kicker">Cadeia curta eficiente</span>
            <strong>Previsão de demanda, rotas otimizadas e crédito assistido para o Seu Zé.</strong>
          </div>
          <div className="stat-grid">
            <StatCard
              value="Desertos expostos"
              label="Mapeamento contínuo das áreas de pior acesso físico e renda"
              detail="Geo IA prioriza zonas de escassez para implantação de pontos de coleta."
            />
            <StatCard
              value="Logística viva"
              label="Matching entre cooperativas e comunidades"
              detail="Fluxos curtos reduzem perdas, queda de preços e aumentam renda local."
            />
          </div>
          <div className="callout">
            Transparência e rastreabilidade para reconstruir o mercado interno articulado e reduzir a
            volatilidade de preços.
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
