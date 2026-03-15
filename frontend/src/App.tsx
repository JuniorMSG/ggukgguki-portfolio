import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import NicknameModal from './components/NicknameModal'
import Nav from './components/layout/Nav'
import SideNav from './components/layout/SideNav'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import AssetDetailPage from './pages/AssetDetailPage'
import CashDetailPage from './pages/CashDetailPage'
import AllocationPage from './pages/AllocationPage'
import DcaPage from './pages/DcaPage'
import CashflowPage from './pages/CashflowPage'
import CalculatorPage from './pages/CalculatorPage'
import TaxSimPage from './pages/TaxSimPage'
import SalaryCalcPage from './pages/SalaryCalcPage'
import FreelancerCalcPage from './pages/FreelancerCalcPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function AppRoutes() {
  const { needsNickname } = useAuth()

  return (
    <>
      {needsNickname && <NicknameModal />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* 공개 페이지 */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/calculator" element={<PublicLayoutWithSide><CalculatorPage /></PublicLayoutWithSide>} />
        <Route path="/calculator/tax" element={<PublicLayoutWithSide><TaxSimPage /></PublicLayoutWithSide>} />
        <Route path="/calculator/salary" element={<PublicLayoutWithSide><SalaryCalcPage /></PublicLayoutWithSide>} />
        <Route path="/calculator/freelancer" element={<PublicLayoutWithSide><FreelancerCalcPage /></PublicLayoutWithSide>} />

        {/* 인증 필요 페이지 */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Nav />
              <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
                <aside className="w-40 shrink-0">
                  <SideNav />
                </aside>
                <main className="flex-1 min-w-0">
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/assets" element={<AssetsPage />} />
                    <Route path="/assets/cash" element={<CashDetailPage />} />
                    <Route path="/assets/:id" element={<AssetDetailPage />} />
                    <Route path="/allocation" element={<AllocationPage />} />
                    <Route path="/dca" element={<DcaPage />} />
                    <Route path="/cashflow" element={<CashflowPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function PublicLayoutWithSide({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <aside className="w-40 shrink-0">
          <SideNav />
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
