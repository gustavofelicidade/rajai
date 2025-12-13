import FeatureCard from '../molecules/FeatureCard'
import SectionTitle from '../atoms/SectionTitle'

const ValueGrid = () => {
  return (
    <section className="section">
      <SectionTitle
        kicker="Problema estrutural"
        title="Distribuição desigual exige uma rede justa"
        subtitle="A fome no Brasil nasce da desarticulação entre produção e consumo. RAJA cria transparência e logística de proximidade para reduzir preços voláteis, desertos alimentares e renda insuficiente."
      />
      <div className="feature-grid">
        <FeatureCard
          tag="Acesso físico"
          title="Desertos alimentares"
          description="Identificamos subdistritos com menor densidade de estabelecimentos saudáveis e baixo poder aquisitivo."
          footer="Mapas dinâmicos priorizam o percentil 25 de acesso."
        />
        <FeatureCard
          tag="Cadeia curta"
          title="Matching produtor ↔ comunidade"
          description="IA sugere pontos de distribuição e coleta conectando cooperativas, feiras e cozinhas solidárias."
          footer="Reduz perdas e devolve renda ao território."
        />
        <FeatureCard
          tag="Renda"
          title="Demanda solvável"
          description="Crédito assistido e previsões de demanda ajudam pequenos produtores a planejar colheitas e acessar capital."
          footer="Tecnologia a favor do Seu Zé, não contra."
        />
        <FeatureCard
          tag="Governança"
          title="Transparência e rastreabilidade"
          description="Painéis abertos mostram preços, fluxos e estoques, diminuindo assimetria de informação e abuso de intermediação."
          footer="Mercado interno articulado e visível."
        />
      </div>
    </section>
  )
}

export default ValueGrid
