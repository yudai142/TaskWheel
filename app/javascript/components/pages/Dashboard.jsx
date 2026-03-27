import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClipboardDocumentListIcon, UserGroupIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [works, setWorks] = useState([])
  const [members, setMembers] = useState([])
  const [histories, setHistories] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(null)

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const day = selectedDate.getDate()
      
      const [worksRes, membersRes, historiesRes] = await Promise.all([
        axios.get('/api/v1/works'),
        axios.get('/api/v1/members'),
        axios.get('/api/v1/histories', {
          params: { year, month, day },
        }),
      ])
      setWorks(worksRes.data)
      setMembers(membersRes.data)
      setHistories(historiesRes.data)
    } catch (error) {
      // Error fetching data
    } finally {
      setLoading(false)
    }
  }

  const handleShuffle = async (workId) => {
    setShuffling(workId)
    try {
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const day = selectedDate.getDate()

      const response = await axios.post('/api/v1/works/shuffle', {
        work_id: workId,
        year,
        month,
        day,
      })
      alert(`${response.data.member.given_name}さんに決定しました！`)
      fetchData()
    } catch (error) {
      const msg = error.response?.data?.error || 'シャッフルに失敗しました'
      alert(msg)
    } finally {
      setShuffling(null)
    }
  }

  const handleShuffleAllWorks = async () => {
    if (works.length === 0) {
      alert('当番が登録されていません')
      return
    }

    setShuffling('all')
    try {
      let successCount = 0
      let assignedMembers = []
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const day = selectedDate.getDate()

      for (const work of works) {
        try {
          const response = await axios.post('/api/v1/works/shuffle', {
            work_id: work.id,
            year,
            month,
            day,
          })
          successCount++
          assignedMembers.push({
            work: work.name,
            member: `${response.data.member.family_name}${response.data.member.given_name}`,
          })
        } catch (error) {
          const msg = error.response?.data?.error
          if (msg) {
            assignedMembers.push({ work: work.name, member: `(スキップ: ${msg})` })
          }
        }
      }

      if (successCount > 0) {
        // 同じメンバーの重複を除去
        await removeDuplicateAssignments()

        const summary = assignedMembers
          .map((a) => `${a.work}→${a.member}`)
          .join('\n')
        alert(`${successCount}個の当番を割り当てました！\n\n${summary}`)
        fetchData()
      } else {
        alert('割り当てに失敗しました')
      }
    } catch (error) {
      alert('一括シャッフルに失敗しました')
    } finally {
      setShuffling(null)
    }
  }

  const removeDuplicateAssignments = async () => {
    try {
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const day = selectedDate.getDate()

      const historiesRes = await axios.get('/api/v1/histories', {
        params: { year, month, day },
      })

      const todayHistories = historiesRes.data
      const memberCounts = {}

      // メンバーごとの割り当て数をカウント
      todayHistories.forEach((h) => {
        if (!memberCounts[h.member_id]) {
          memberCounts[h.member_id] = []
        }
        memberCounts[h.member_id].push(h.id)
      })

      // 重複しているメンバーの場合、最初の1つ以外を削除
      for (const memberId in memberCounts) {
        if (memberCounts[memberId].length > 1) {
          const idsToDelete = memberCounts[memberId].slice(1)
          for (const historyId of idsToDelete) {
            try {
              await axios.delete(`/api/v1/histories/${historyId}`)
            } catch (error) {
              // 削除に失敗した場合はスキップ
            }
          }
        }
      }
    } catch (error) {
      // 重複除去に失敗した場合はスキップ
    }
  }

  const handleDeleteMember = async (historyId) => {
    if (!window.confirm('この割り当てを削除しますか？')) return
    try {
      await axios.delete(`/api/v1/histories/${historyId}`)
      fetchData()
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  const getTodayAssignedMembers = (workId) => {
    return histories.filter((h) => h.work_id === workId)
  }

  const handlePrevDay = () => {
    const prevDate = new Date(selectedDate)
    prevDate.setDate(prevDate.getDate() - 1)
    setSelectedDate(prevDate)
  }

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate)
    nextDate.setDate(nextDate.getDate() + 1)
    setSelectedDate(nextDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const isToday = (date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-600">読み込み中...</div>
  }

  const activeMembers = members.filter((m) => !m.archive).length

  return (
    <div className="space-y-6">
      {/* Date Navigation Header */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={handlePrevDay}
            className="btn-secondary flex items-center p-2"
            title="前の日"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-6 w-6 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900 min-w-64 text-center">
              {formatDate(selectedDate)}
            </span>
            {!isToday(selectedDate) && (
              <button
                onClick={handleToday}
                className="text-sm px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                今日
              </button>
            )}
          </div>
          <button
            onClick={handleNextDay}
            className="btn-secondary flex items-center p-2"
            title="次の日"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Works Count Card */}
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wide">当番数</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{works.length}</p>
              <p className="text-xs text-primary-600 mt-2">個の当番が登録されています</p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary-200">
                <ClipboardDocumentListIcon className="h-8 w-8 text-primary-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Members Count Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">メンバー数</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">{members.length}</p>
              <p className="text-xs text-blue-600 mt-2">人が参加しています</p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-blue-200">
                <UserGroupIcon className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Members Card */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">活動中</p>
              <p className="text-4xl font-bold text-green-900 mt-2">{activeMembers}</p>
              <p className="text-xs text-green-600 mt-2">人が活動中です</p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-green-200">
                <CheckCircleIcon className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Works List Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">{formatDate(selectedDate)}の当番</h2>
          </div>
          <button
            onClick={handleShuffleAllWorks}
            disabled={shuffling === 'all' || works.length === 0 || members.length === 0}
            className={`btn-primary flex items-center justify-center transition-all duration-200 ${
              shuffling === 'all' ? 'opacity-75 cursor-wait' : ''
            } ${works.length === 0 || members.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {shuffling === 'all' ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                処理中...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                一括シャッフル
              </>
            )}
          </button>
        </div>

        {works.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">当番が登録されていません</p>
            <p className="text-gray-400 text-sm mt-2">「当番」ページから追加してください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {works.map((work) => {
              const todayAssignments = getTodayAssignedMembers(work.id)
              return (
                <div
                  key={work.id}
                  className="border border-gray-200 rounded-xl p-5 bg-gradient-to-r from-gray-50 to-gray-25 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="h-3 w-3 bg-primary-600 rounded-full mr-3"></div>
                        <h3 className="text-lg font-semibold text-gray-900">{work.name}</h3>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                        今日の割り当て: {todayAssignments.length}人
                      </span>
                    </div>
                  </div>

                  {/* Today's Assigned Members */}
                  {todayAssignments.length > 0 ? (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-600 mb-3">
                        本日の割り当てメンバー:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {todayAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            onClick={() => handleDeleteMember(assignment.id)}
                            className="p-4 bg-white border-2 border-primary-300 rounded-lg hover:bg-red-50 hover:border-red-400 cursor-pointer transition-all flex items-center justify-center"
                          >
                            <p className="font-semibold text-gray-900 text-center">
                              {assignment.member?.family_name}
                              {assignment.member?.given_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-500 text-center py-2">
                        本日の割り当てメンバーはいません。シャッフルボタンで割り当てをしてください。
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
