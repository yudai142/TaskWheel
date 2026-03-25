import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Works() {
  const [works, setWorks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    multiple: 1,
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/v1/works', { work: formData })
      setFormData({ name: '', multiple: 1 })
      setShowForm(false)
      fetchData()
    } catch (error) {
      alert('当番の追加に失敗しました')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('この当番を削除しますか？')) return
    try {
      await axios.delete(`/api/v1/works/${id}`)
      fetchData()
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  if (loading) return <div className="text-center py-12">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">当番管理</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                当番名
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                複数割り当て数
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.multiple}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    multiple: parseInt(e.target.value),
                  })
                }
                min="1"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              追加
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {works.map((work) => (
          <div key={work.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {work.name}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    メンバー: {work.members?.length || 0}人
                  </p>
                  {work.multiple && (
                    <p className="text-sm text-gray-600">
                      複数割り当て: {work.multiple}人
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(work.id)}
                className="btn-danger"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
