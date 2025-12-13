
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/landingPage'
import MapPage from './pages/mapPage'
import { Footer } from './components/footer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<h1>Login </h1>} />
        <Route path="/mapa" element={<MapPage />} />
      </Routes>
      <Footer />
    </BrowserRouter >
  )
}

export default App
