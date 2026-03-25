import React, { useState } from 'react'
import axios from 'axios'

export default function Settings() {
  const [resetDate, setResetDate] = useState('')
  const [weekMode, setWeekMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleResetDateChange = async (e) => {
    const date = e.target.value
    setResetDate(date)

    if (!date) return

    setSaving(true)
    try {
      await axios.post('/api/v1/shuffle_options', {
        shuffle_option: { reset_date: date },
      })
      alert('リセット日付を更新しました')
    } catch (error) {
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleWeekModeToggle = async () => {
    setSaving(true)
    try {
      setWeekMode(!weekMode)
      // TODO: Implement week mode toggle API
      alert('週間モードを更新しました')
    } catch (error) {
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">設定</h2>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          シャッフル設定
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              リセット日付
            </label>
            <input
              type="date"
              className="input-field"
              value={resetDate}
              onChange={handleResetDateChange}
              disabled={saving}
            />
            <p className="text-sm text-gray-500 mt-2">
              指定した日付で当番割り当ての履歴がリセットされます
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="week_mode"
              checked={weekMode}
              onChange={handleWeekModeToggle}
              disabled={saving}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="week_mode" className="text-sm font-medium text-gray-700">
              週間モード
            </label>
          </div>
          <p className="text-sm text-gray-500">
            オンの場合、曜日ごとの当番割り当てを管理します
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          バックアップ
        </h3>
        <button className="btn-secondary w-full">
          データをエクスポート
        </button>
        <p className="text-sm text-gray-500 mt-2">
          現在のすべてのデータをCSVファイルでダウンロードします
        </p>
      </div>

      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          危険なアクション
        </h3>
        <button className="btn-danger w-full">
          すべてのデータを削除
        </button>
        <p className="text-sm text-red-700 mt-2">
          警告: この操作はやり直せません。すべてのデータが削除されます。
        </p>
      </div>
    </div>
  )
}
