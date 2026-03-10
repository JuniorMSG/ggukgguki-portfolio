import { useState } from 'react'
import AccountList from './components/AccountList'
import AccountForm from './components/AccountForm'
import AssetRatioChart from './components/AssetRatioChart'
import DcaForm from './components/DcaForm'
import DcaHistory from './components/DcaHistory'

const USER_ID = 1 // TODO: 로그인 구현 후 동적으로

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            꾹꾹이
            <span className="ml-2 text-sm font-normal text-gray-400">매주 꾹꾹 눌러서 기록하는 포트폴리오</span>
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <AssetRatioChart userId={USER_ID} />
        <AccountList userId={USER_ID} refreshKey={refreshKey} />
        <AccountForm userId={USER_ID} onCreated={handleRefresh} />
        <DcaForm userId={USER_ID} onCreated={handleRefresh} />
        <DcaHistory refreshKey={refreshKey} />
      </main>
    </div>
  )
}

export default App
