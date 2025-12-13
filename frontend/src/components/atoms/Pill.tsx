type PillProps = {
  label: string
  tone?: 'accent' | 'muted' | 'success'
  className?: string
}

const Pill = ({ label, tone = 'accent', className = '' }: PillProps) => {
  return <span className={`pill pill--${tone} ${className}`.trim()}>{label}</span>
}

export default Pill
