import React, { useState, useEffect } from 'react'
import axios from 'axios'
import type { History } from '../../types'

export default function HistoryPage(): JSX.Element {
  const [histories, setHistories] = useState<History[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  useEffect(() => {
    fetchHistories()
  }, [selectedMonth])

  const fetchHistories = async (): Promise<void> => {
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const response = await axios.get<History[]>('/api/v1/histories', {
        params: { year, month },
      })
      setHistories(response.data)
    } catch {
      // Error fetching histories
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('この記録を削除しますか？')) return
    try {
      await axios.delete(`/api/v1/histories/${id}`)
      fetchHistories()
    } catch {
      alert('削除に失敗しました')
    }
  }

  const groupedHistories = histories.reduce<Record<string, History[]>>((acc, history) => {
    const date = new Date(history.date).toLocaleDateString('ja-JP')
    if (!acc[date]) acc[date] = []
    acc[date].push(history)
    return acc
  }, {})

  if (loading) return <div className="text-center py-12">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">履歴管理</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1)
              )
            }
            className="btn-secondary"
          >
            ←
          </button>
          <span className="font-medium">
            {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
          </span>
          <button
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)
              )
            }
            className="btn-secondary"
          >
            →
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedHistories).map(([date, dayHistories]) => (
          <div key={date} className="card">
            <h3 className="font-semibold text-gray-900 mb-3">{date}</h3>
            <div className="space-y-2">
              {dayHistories.map((history) => (
                <div
                  key={history.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900">{history.work?.name}</p>
                    <p className="text-sm text-gray-600">
                      {history.member?.family_name}
                      {history.member?.given_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(history.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {histories.length === 0 && (
        <div className="text-center py-12 text-gray-500">記録がありません</div>
      )}
    </div>
  )
}
