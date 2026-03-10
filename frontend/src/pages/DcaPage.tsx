import { useState } from 'react'
import DcaForm from '../components/DcaForm'
import DcaHistory from '../components/DcaHistory'

const USER_ID = 1

export default function DcaPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">DCA 적립식 투자</h2>
      <DcaForm userId={USER_ID} onCreated={() => setRefreshKey((k) => k + 1)} />
      <DcaHistory refreshKey={refreshKey} />
    </div>
  )
}
