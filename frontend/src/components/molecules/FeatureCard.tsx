import Pill from '../atoms/Pill'

type FeatureCardProps = {
  title: string
  description: string
  tag?: string
  footer?: string
}

const FeatureCard = ({ title, description, tag, footer }: FeatureCardProps) => {
  return (
    <article className="feature-card">
      {tag ? <Pill label={tag} tone="muted" /> : null}
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__description">{description}</p>
      {footer ? <span className="feature-card__footer">{footer}</span> : null}
    </article>
  )
}

export default FeatureCard
