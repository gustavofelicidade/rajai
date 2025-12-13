import type { ReactNode } from 'react'
import Button from '../atoms/Button'

type MainLayoutProps = {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">RA</div>
          <div className="brand-name">
            <strong>RAJA</strong>
            <span className="brand-tagline">Rede de Acesso Justo a Alimentos</span>
          </div>
        </div>
        <div className="topbar__actions">
          <Button variant="ghost">Manifesto</Button>
          <Button variant="primary">Ver mapa piloto</Button>
        </div>
      </header>
      <main className="layout">{children}</main>
    </div>
  )
}

export default MainLayout
