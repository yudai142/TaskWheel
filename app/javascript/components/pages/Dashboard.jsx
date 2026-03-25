import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [works, setWorks] = useState([])
  const [members, setMembers] = useState([])
  const [todayHistory, setTodayHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [worksRes, membersRes] = await Promise.all([
        axios.get('/api/v1/works'),
        axios.get('/api/v1/members'),
      ])
      setWorks(worksRes.data)
      setMembers(membersRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShuffle = async (workId) => {
    try {
      const response = await axios.post('/api/v1/works/shuffle', { work_id: workId })
      alert(`${response.data.member.given_name}さんに決定しました！`)
      fetchData()
    } catch (error) {
      alert('シャッフルに失敗しました')
    }
  }

  if (loading) {
    return <div className="text-center py-12">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">当番数</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">{works.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">メンバー数</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">{members.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">活動中</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {members.filter((m) => !m.archive).length}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">当番一覧</h3>
        <div className="space-y-3">
          {works.map((work) => (
            <div
              key={work.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <h4 className="font-medium text-gray-900">{work.name}</h4>
                <p className="text-sm text-gray-500">
                  {work.members.length}人のメンバー
                </p>
              </div>
              <button
                onClick={() => handleShuffle(work.id)}
                className="btn-primary"
              >
                シャッフル
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
