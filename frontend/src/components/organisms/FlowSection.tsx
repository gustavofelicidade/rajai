import SectionTitle from '../atoms/SectionTitle'
import FlowStep from '../molecules/FlowStep'

const FlowSection = () => {
  const steps = [
    {
      title: 'Mapeamos desertos e renda',
      description:
        'Geo IA cruza POF, CNEFE e bases do Rio para identificar onde a população tem menor acesso físico e menor renda.',
    },
    {
      title: 'Conectamos produção local',
      description:
        'Matching automático entre cooperativas, agricultores familiares e pontos de coleta nos subdistritos prioritários.',
    },
    {
      title: 'Operamos logística viva',
      description:
        'Langgraph orquestra previsões de demanda, rotas e estoque, ajustando entregas semanais para reduzir perdas.',
    },
    {
      title: 'Transparência para o mercado interno',
      description:
        'Painéis de preços, origem e impacto social devolvem poder de decisão às comunidades e aos pequenos produtores.',
    },
  ]

  return (
    <section className="section">
      <SectionTitle
        kicker="Caminho RAJA"
        title="Fluxo contínuo de dados, logística e inclusão digital"
        subtitle="Tecnologia como infraestrutura pública de acesso justo: IA como ponte entre o Seu Zé e quem precisa comer bem perto de casa."
      />
      <div className="flow-grid">
        {steps.map((step, index) => (
          <FlowStep key={step.title} index={index + 1} title={step.title} description={step.description} />
        ))}
      </div>
    </section>
  )
}

export default FlowSection
