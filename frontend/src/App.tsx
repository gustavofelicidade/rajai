
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/landingPage'
import MapPage from './pages/mapPage'
import LogisticaPage from './pages/logisticaPage'
import AgentesPage from './pages/agentesPage'
import BioporanAgent from './agents/bioporan'
import RajaiAgent from './agents/rajai'
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
      </Routes>
    </BrowserRouter >
  )
}

export default App
