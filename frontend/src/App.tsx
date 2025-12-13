
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/landingPage'
import MapPage from './pages/mapPage'
import MapLayout from './layouts/MapLayout'
import { Footer } from './components/footer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><LandingPage /><Footer /></>} />
        <Route path="/login" element={<><h1>Login </h1><Footer /></>} />
        <Route path="/mapa" element={<MapLayout><MapPage /></MapLayout>} />
      </Routes>
    </BrowserRouter >
  )
}

export default App
