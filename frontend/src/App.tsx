import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/layout/Nav'
import DashboardPage from './pages/DashboardPage'
import AccountsPage from './pages/AccountsPage'
import AssetsPage from './pages/AssetsPage'
import DcaPage from './pages/DcaPage'
import CashflowPage from './pages/CashflowPage'
import TaxSimPage from './pages/TaxSimPage'
import SalaryCalcPage from './pages/SalaryCalcPage'
import FreelancerCalcPage from './pages/FreelancerCalcPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/dca" element={<DcaPage />} />
            <Route path="/cashflow" element={<CashflowPage />} />
            <Route path="/tax" element={<TaxSimPage />} />
            <Route path="/salary" element={<SalaryCalcPage />} />
            <Route path="/freelancer" element={<FreelancerCalcPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
