import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Works from './pages/Works'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/works" element={<Works />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}
