import SectionTitle from '../atoms/SectionTitle'
import StatCard from '../molecules/StatCard'

const ImpactMetrics = () => {
  return (
    <section className="section">
      <SectionTitle
        kicker="Indicadores de impacto"
        title="Do diagnóstico à implementação rápida"
        subtitle="Métricas que guiam o piloto: densidade de estabelecimentos saudáveis, redução de perdas na cadeia urbana e elevação da capacidade aquisitiva das comunidades."
      />
      <div className="stat-grid">
        <StatCard
          value="+25% estabelecimentos"
          label="Objetivo: aumentar densidade de pontos de venda saudáveis nos territórios alvo."
          detail="Parcerias com feiras, mercearias e cozinhas comunitárias."
        />
        <StatCard
          value="-15% perdas logísticas"
          label="Rotas curtas e previsões de demanda diminuem desperdício urbano."
          detail="IA monitora gargalos e ajusta fluxo semanalmente."
        />
        <StatCard
          value="Renda fortalecida"
          label="Crédito assistido para agricultura familiar e microempreendedores."
          detail="Modelos preditivos reduzem risco e abrem acesso a capital."
        />
      </div>
    </section>
  )
}

export default ImpactMetrics
