import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import SkinDetail from './pages/SkinDetail'
import Portfolio from './pages/Portfolio'
import Arbitrage from './pages/Arbitrage'
import Alerts from './pages/Alerts'
import Cases from './pages/Cases'
import ActuaAhora from './pages/ActuaAhora'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0a0e1a]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/actua-ahora" element={<ActuaAhora />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/skin/:id" element={<SkinDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/arbitrage" element={<Arbitrage />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/cases" element={<Cases />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
