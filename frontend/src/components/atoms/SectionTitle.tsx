type SectionTitleProps = {
  kicker?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

const SectionTitle = ({
  kicker,
  title,
  subtitle,
  align = 'left',
}: SectionTitleProps) => {
  return (
    <div className="section-title" style={{ textAlign: align }}>
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
      <h2>{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  )
}

export default SectionTitle
