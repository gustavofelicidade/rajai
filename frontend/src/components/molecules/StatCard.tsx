type StatCardProps = {
  value: string
  label: string
  detail?: string
}

const StatCard = ({ value, label, detail }: StatCardProps) => {
  return (
    <div className="stat-card">
      <h4 className="stat-card__value">{value}</h4>
      <p className="stat-card__label">{label}</p>
      {detail ? <p className="stat-card__detail">{detail}</p> : null}
    </div>
  )
}

export default StatCard
