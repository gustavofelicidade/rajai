type FlowStepProps = {
  index: number
  title: string
  description: string
}

const FlowStep = ({ index, title, description }: FlowStepProps) => {
  return (
    <div className="flow-step">
      <div className="flow-step__index">{index}</div>
      <h4 className="feature-card__title">{title}</h4>
      <p className="feature-card__description">{description}</p>
    </div>
  )
}

export default FlowStep
