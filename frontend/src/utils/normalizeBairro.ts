const SPACE_RE = /\s+/g
const PUNCT_RE = /[^\w\s/-]/g

const ALIASES: Record<string, string> = {
  // Ajustes caso GeoJSON use nomes diferentes do CSV
  'VL ISABEL': 'VILA ISABEL',
  'ZONA PORTUARIA': 'ZONA PORTUARIA',
}

export function normalizeBairro(name: string): string {
  if (!name) return ''
  let s = name.trim().toUpperCase()

  // remove acentos
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // remove pontuação (mantém / e -)
  s = s.replace(PUNCT_RE, '')

  // espaços
  s = s.replace(SPACE_RE, ' ').trim()

  return ALIASES[s] ?? s
}
