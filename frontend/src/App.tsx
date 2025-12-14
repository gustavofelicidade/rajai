
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/landingPage'
import MapPage from './pages/mapPage'
import LogisticaPage from './pages/logisticaPage'
import AgentesPage from './pages/agentesPage'
import BioporanAgent from './agents/bioporan'
import RajaiAgent from './agents/rajai'
import RelatorioAgent from './agents/relatorio'
import AnalisadorDadosLocaisAgent from './agents/analisador_dados_locais'
import RoteiristaLogisticoAgent from './agents/roteirista_logistico'
import OnboardingProdutoresAgent from './agents/onboarding_produtores'
import MapLayout from './layouts/MapLayout'
import { Footer } from './components/footer'
import ChatbotPage from './pages/chatbotPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><LandingPage /><Footer /></>} />
        <Route path="/login" element={<><h1>Login </h1><Footer /></>} />
        <Route path="/mapa" element={<MapLayout><MapPage /></MapLayout>} />
        <Route path="/chatbot" element={<MapLayout><ChatbotPage /></MapLayout>} />
        <Route path="/mapa/logistica" element={<MapLayout><LogisticaPage /></MapLayout>} />
        <Route path="/mapa/agentes" element={<MapLayout><AgentesPage /></MapLayout>} />
        <Route path="/mapa/agentes/biopora" element={<MapLayout><BioporanAgent /></MapLayout>} />
        <Route path="/mapa/agentes/rajai" element={<MapLayout><RajaiAgent /></MapLayout>} />
        <Route path="/mapa/agentes/relatorio" element={<MapLayout><RelatorioAgent /></MapLayout>} />
        <Route path="/mapa/agentes/analisador" element={<MapLayout><AnalisadorDadosLocaisAgent /></MapLayout>} />
        <Route path="/mapa/agentes/roteirista" element={<MapLayout><RoteiristaLogisticoAgent /></MapLayout>} />
        <Route path="/mapa/agentes/onboarding" element={<MapLayout><OnboardingProdutoresAgent /></MapLayout>} />
      </Routes>
    </BrowserRouter >
  )
}

export default App
