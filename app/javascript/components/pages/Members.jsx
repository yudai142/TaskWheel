import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    family_name: '',
    given_name: '',
    kana_name: '',
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/api/v1/members')
      setMembers(response.data)
    } catch (error) {
      // Error fetching members
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/v1/members', { member: formData })
      setFormData({ family_name: '', given_name: '', kana_name: '' })
      setShowForm(false)
      fetchMembers()
    } catch (error) {
      alert('メンバーの追加に失敗しました')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('このメンバーを削除しますか？')) return
    try {
      await axios.delete(`/api/v1/members/${id}`)
      fetchMembers()
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  if (loading) return <div className="text-center py-12">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">メンバー管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">苗字</label>
              <input
                type="text"
                className="input-field"
                value={formData.family_name}
                onChange={(e) =>
                  setFormData({ ...formData, family_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">名前</label>
              <input
                type="text"
                className="input-field"
                value={formData.given_name}
                onChange={(e) =>
                  setFormData({ ...formData, given_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">かな名</label>
              <input
                type="text"
                className="input-field"
                value={formData.kana_name}
                onChange={(e) =>
                  setFormData({ ...formData, kana_name: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              追加
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {member.family_name}
                  {member.given_name}
                </h3>
                <p className="text-sm text-gray-500">{member.kana_name}</p>
              </div>
              <button
                onClick={() => handleDelete(member.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
            {member.archive && (
              <span className="badge-danger mt-2">アーカイブ中</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
