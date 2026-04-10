import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AssignMemberModal } from '../AssignMemberModal';
import type { Member, Work, History } from '../../types';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface Props {
  worksheetId: number | null;
  _isDemoUser?: boolean;
}

type StatsTab = 'works' | 'members' | 'assigned';

export default function Dashboard({ worksheetId, _isDemoUser = false }: Props): JSX.Element {
  const [works, setWorks] = useState<Work[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [histories, setHistories] = useState<History[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [shuffling, setShuffling] = useState<number | 'all' | null>(null);
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>('works');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState<Member | null>(
    null
  );
  const [currentAssignmentWorkId, setCurrentAssignmentWorkId] = useState<number | null>(null);
  const [showAssignMemberModal, setShowAssignMemberModal] = useState<boolean>(false);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();

      const [worksRes, membersRes, historiesRes] = await Promise.all([
        axios.get<Work[]>('/api/v1/works', {
          params: { worksheet_id: worksheetId },
        }),
        axios.get<Member[]>('/api/v1/members', {
          params: { worksheet_id: worksheetId },
        }),
        axios.get<History[]>('/api/v1/histories', {
          params: { year, month, day, worksheet_id: worksheetId },
        }),
      ]);
      setWorks(worksRes.data.sort((a, b) => a.id - b.id));
      setMembers(membersRes.data);
      setHistories(historiesRes.data);
    } catch {
      // Error fetching data
    } finally {
      setLoading(false);
    }
  }, [selectedDate, worksheetId]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShuffle = async (workId: number): Promise<void> => {
    // その日のhistoryレコード全体（work_idに関わらず）
    const allMembersWithRecords = Array.from(new Set(histories.map((h: History) => h.member_id)));

    if (allMembersWithRecords.length === 0) {
      showNotification('メンバーを1人以上選択してください', 'error');
      return;
    }

    // シャッフル中はスキップ
    if (shuffling !== null) {
      showNotification('シャッフル処理中です。お待ちください', 'error');
      return;
    }

    // 除外状態をチェック
    const work = works.find((w: Work) => w.id === workId);
    if (work && !work.is_above) {
      showNotification('このタスクはシャッフル対象から除外されています', 'error');
      return;
    }

    setShuffling(workId);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();

      const response = await axios.post<{ member: Member }>('/api/v1/works/shuffle', {
        work_id: workId,
        participant_member_ids: allMembersWithRecords,
        year,
        month,
        day,
      });
      showNotification(`${response.data.member.name}さんに決定しました！`);
      await fetchData();
      setActiveStatsTab('assigned');
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const msg = axiosError.response?.data?.error || 'シャッフルに失敗しました';
      showNotification(msg, 'error');
    } finally {
      setShuffling(null);
    }
  };

  const handleShuffleAllWorks = async (): Promise<void> => {
    // その日のhistoryレコード全体（work_idに関わらず）
    const allMembersWithRecords = Array.from(new Set(histories.map((h: History) => h.member_id)));

    if (works.length === 0) {
      showNotification('タスクが登録されていません', 'error');
      return;
    }

    if (allMembersWithRecords.length === 0) {
      showNotification('メンバーを1人以上選択してください', 'error');
      return;
    }
    if (validWorksCount === 0) {
      showNotification('シャッフル対象のタスクがありません。タスク一覧を確認してください', 'error');
      return;
    }

    if (shuffling !== null) {
      showNotification('シャッフル処理中です。お待ちください', 'error');
      return;
    }
    setShuffling('all');
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const response = await axios.post<{ assigned_count?: number; unassigned_count?: number }>(
        '/api/v1/works/shuffle',
        {
          year,
          month,
          day,
          worksheet_id: worksheetId,
        }
      );

      const assignedCount = response.data.assigned_count ?? 0;
      const unassignedCount = response.data.unassigned_count ?? 0;

      await fetchData();
      setActiveStatsTab('assigned');

      showNotification(
        `シャッフル完了: 割り当て ${assignedCount}人 / 未割り当て ${unassignedCount}人`
      );
    } catch {
      showNotification('一括シャッフルに失敗しました', 'error');
    } finally {
      setShuffling(null);
    }
  };

  const handleDeleteMember = async (historyId: number): Promise<void> => {
    if (!window.confirm('この割り当てを削除しますか？')) return;
    try {
      await axios.delete(`/api/v1/histories/${historyId}`);
      fetchData();
    } catch {
      showNotification('削除に失敗しました', 'error');
    }
  };

  const handleOpenAssignMemberModal = (memberName: string, workId: number): void => {
    const member = members.find((m) => m.name === memberName);
    if (member) {
      setSelectedMemberForAssignment(member);
      setCurrentAssignmentWorkId(workId);
      setShowAssignMemberModal(true);
    }
  };

  const handleSaveAssignment = async (): Promise<void> => {
    fetchData();
    setShowAssignMemberModal(false);
    setSelectedMemberForAssignment(null);
    setCurrentAssignmentWorkId(null);
  };

  const getTodayAssignedMembers = (workId: number): History[] => {
    return histories.filter((h: History) => h.work_id === workId);
  };

  const activeMembers = members.filter((member: Member) => !member.archive);

  // 日付を YYYY-MM-DD 形式で取得（ローカル時間）
  const getDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleToggleParticipant = async (memberId: number): Promise<void> => {
    // チェック状態をチェックボックスと同じ方法で判定（履歴に基づく）
    const isCurrentlyChecked = histories.some((h: History) => h.member_id === memberId);
    const dateStr = getDateString(selectedDate);

    try {
      if (isCurrentlyChecked) {
        // チェック外す → History レコードを削除
        const recordToDelete = histories.find((h: History) => {
          const hDate = typeof h.date === 'string' ? h.date : getDateString(new Date(h.date));
          return h.member_id === memberId && hDate === dateStr;
        });
        if (recordToDelete) {
          await axios.delete(`/api/v1/histories/${recordToDelete.id}`);
        }
      } else {
        // チェック入れる → 既存チェック後、History レコードを作成（work_id=null）
        const existingRecord = histories.find((h: History) => {
          const hDate = typeof h.date === 'string' ? h.date : getDateString(new Date(h.date));
          return h.member_id === memberId && hDate === dateStr;
        });

        if (!existingRecord) {
          await axios.post('/api/v1/histories', {
            history: {
              member_id: memberId,
              work_id: null,
              date: dateStr,
            },
          });
        }
      }

      // データを再取得
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();

      const [worksRes, membersRes, historiesRes] = await Promise.all([
        axios.get<Work[]>('/api/v1/works'),
        axios.get<Member[]>('/api/v1/members'),
        axios.get<History[]>('/api/v1/histories', {
          params: { year, month, day },
        }),
      ]);
      setWorks(worksRes.data.sort((a, b) => a.id - b.id));
      setMembers(membersRes.data);
      setHistories(historiesRes.data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string; errors?: string[] } } };
      const msg =
        axiosError.response?.data?.errors?.join(', ') ||
        axiosError.response?.data?.error ||
        'メンバー選択の更新に失敗しました';
      showNotification(msg, 'error');
      console.error('handleToggleParticipant error:', error);
    }
  };

  const handleToggleWorkExclusion = async (workId: number): Promise<void> => {
    try {
      // 現在の Work オブジェクトを取得
      const work = works.find((w: Work) => w.id === workId);
      if (!work) return;

      // is_above を反転
      // チェック入れる（除外） = is_above を false に
      // チェック外す（対象に戻す） = is_above を true に
      const newIsAbove = !work.is_above;

      // API で Work を更新
      await axios.patch(`/api/v1/works/${workId}`, {
        work: {
          is_above: newIsAbove,
        },
      });

      // データを再取得
      const worksRes = await axios.get<Work[]>('/api/v1/works');
      setWorks(worksRes.data.sort((a, b) => a.id - b.id));
      showNotification('タスクの設定を更新しました', 'success');
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string; errors?: string[] } } };
      const msg =
        axiosError.response?.data?.errors?.join(', ') ||
        axiosError.response?.data?.error ||
        'タスクの更新に失敗しました';
      showNotification(msg, 'error');
      console.error('handleToggleWorkExclusion error:', error);
    }
  };

  const handleSelectAllParticipants = async (): Promise<void> => {
    try {
      const dateStr = getDateString(selectedDate);

      // 既存レコードをチェック
      const existingMembers = histories
        .filter((h: History) => {
          const hDate = typeof h.date === 'string' ? h.date : getDateString(new Date(h.date));
          return hDate === dateStr;
        })
        .map((h: History) => h.member_id);

      const toAdd = activeMembers.filter((m: Member) => !existingMembers.includes(m.id));

      // 新規メンバーの History レコードを作成
      for (const member of toAdd) {
        await axios.post('/api/v1/histories', {
          history: {
            member_id: member.id,
            work_id: null,
            date: dateStr,
          },
        });
      }

      // データを再取得
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();

      const [worksRes, membersRes, historiesRes] = await Promise.all([
        axios.get<Work[]>('/api/v1/works'),
        axios.get<Member[]>('/api/v1/members'),
        axios.get<History[]>('/api/v1/histories', {
          params: { year, month, day },
        }),
      ]);
      setWorks(worksRes.data.sort((a, b) => a.id - b.id));
      setMembers(membersRes.data);
      setHistories(historiesRes.data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string; errors?: string[] } } };
      const msg =
        axiosError.response?.data?.errors?.join(', ') ||
        axiosError.response?.data?.error ||
        '全選択に失敗しました';
      showNotification(msg, 'error');
      console.error('handleSelectAllParticipants error:', error);
    }
  };

  const handleClearAllParticipants = async (): Promise<void> => {
    try {
      const dateStr = getDateString(selectedDate);

      // その日の全メンバーの History レコードを削除
      const toDelete = histories.filter((h: History) => {
        const hDate = typeof h.date === 'string' ? h.date : getDateString(new Date(h.date));
        return hDate === dateStr;
      });

      for (const record of toDelete) {
        await axios.delete(`/api/v1/histories/${record.id}`);
      }

      // データを再取得
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();

      const [worksRes, membersRes, historiesRes] = await Promise.all([
        axios.get<Work[]>('/api/v1/works'),
        axios.get<Member[]>('/api/v1/members'),
        axios.get<History[]>('/api/v1/histories', {
          params: { year, month, day },
        }),
      ]);
      setWorks(worksRes.data.sort((a, b) => a.id - b.id));
      setMembers(membersRes.data);
      setHistories(historiesRes.data);
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string; errors?: string[] } } };
      const msg =
        axiosError.response?.data?.errors?.join(', ') ||
        axiosError.response?.data?.error ||
        '全解除に失敗しました';
      showNotification(msg, 'error');
      console.error('handleClearAllParticipants error:', error);
    }
  };

  const handlePrevDay = (): void => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const handleNextDay = (): void => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const handleToday = (): void => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">読み込み中...</div>;
  }

  const showParticipantSection = activeStatsTab === 'members';
  const showWorksSection = activeStatsTab === 'assigned';

  // 統計データ計算
  const validWorksCount = works.filter((w: Work) => w.is_above).length;

  // 未割り当てメンバーを計算
  // work_id が null = 参加しているが未割り当て
  // work_id が null でない = 割り当て済み
  const participatingMemberIds = Array.from(
    new Set(histories.filter((h: History) => h.work_id === null).map((h: History) => h.member_id))
  );
  const assignedMemberIds = Array.from(
    new Set(histories.filter((h: History) => h.work_id !== null).map((h: History) => h.member_id))
  );
  const assignedMembersCount = new Set(histories.map((h: History) => h.member_id)).size;
  const selectedMembersCount = participatingMemberIds.length;
  const unassignedMemberIds = participatingMemberIds.filter(
    (memberId: number) => !assignedMemberIds.includes(memberId)
  );
  const unassignedMembers = members.filter((m: Member) => unassignedMemberIds.includes(m.id));

  return (
    <div className="space-y-6">
      {/* AssignMemberModal */}
      {worksheetId && selectedMemberForAssignment && (
        <AssignMemberModal
          isOpen={showAssignMemberModal}
          member={selectedMemberForAssignment}
          works={works}
          worksheetId={worksheetId}
          currentWorkId={currentAssignmentWorkId}
          onClose={() => {
            setShowAssignMemberModal(false);
            setSelectedMemberForAssignment(null);
            setCurrentAssignmentWorkId(null);
          }}
          onSave={handleSaveAssignment}
        />
      )}

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-fade-in">
          <div
            className={`rounded-xl shadow-lg p-4 flex items-start gap-3 border ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-300 text-green-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex-1 whitespace-pre-wrap text-sm font-medium">
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Date Navigation Header */}
      <div
        className={`card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 sticky top-0 z-40 transition-all ${
          isScrolled ? 'py-1 shadow-lg' : 'py-4'
        }`}
      >
        <div
          className={`flex items-center justify-center flex-wrap transition-all ${isScrolled ? 'gap-1.5' : 'gap-3'}`}
        >
          <button
            onClick={handlePrevDay}
            className={`btn-secondary flex items-center transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}
            title="前の日"
          >
            <ChevronLeftIcon className={`transition-all ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          <div className="flex items-center space-x-2 relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
              title="カレンダーを表示"
            >
              <CalendarIcon className={`transition-all ${isScrolled ? 'h-5 w-5' : 'h-6 w-6'}`} />
            </button>
            {showCalendar && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-indigo-100 p-2">
                  <Calendar
                    value={selectedDate}
                    onChange={(value: unknown) => {
                      if (value instanceof Date) {
                        setSelectedDate(value);
                        setShowCalendar(false);
                      }
                    }}
                    locale="ja-JP"
                    className="react-calendar-custom"
                  />
                </div>
              </>
            )}
            <span
              className={`font-bold text-gray-900 whitespace-nowrap transition-all ${isScrolled ? 'text-base' : 'text-xl'}`}
            >
              {formatDate(selectedDate)}
            </span>
            {!isToday(selectedDate) && (
              <button
                onClick={handleToday}
                className={`bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium flex-shrink-0 ${isScrolled ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'}`}
              >
                今日
              </button>
            )}
          </div>

          <button
            onClick={() => {
              const isDisabled =
                shuffling === 'all' || validWorksCount === 0 || histories.length === 0;
              if (isDisabled && histories.length === 0) {
                showNotification('参加メンバーを選択してください', 'error');
                return;
              }
              if (!isDisabled) {
                handleShuffleAllWorks();
              }
            }}
            className={`flex items-center justify-center font-medium rounded-lg transition-all duration-200 ${
              shuffling === 'all' || validWorksCount === 0 || histories.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 pointer-events-auto'
                : 'btn-primary hover:shadow-lg'
            } ${isScrolled ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}
          >
            {shuffling === 'all' ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                <span className={isScrolled ? 'hidden sm:inline' : ''}>処理中...</span>
              </>
            ) : (
              <>
                <SparklesIcon className={`mr-2 ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <span className={isScrolled ? 'hidden sm:inline' : ''}>シャッフル</span>
              </>
            )}
          </button>

          <button
            onClick={handleNextDay}
            className={`btn-secondary flex items-center transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}
            title="次の日"
          >
            <ChevronRightIcon className={`transition-all ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards as Tabs */}
      <div
        className={`grid sticky top-12 z-30 bg-white rounded-lg transition-all border ${
          isScrolled
            ? 'py-1.5 px-2 shadow-md grid-cols-1 md:grid-cols-3 gap-1.5 lg:gap-2 border-gray-200'
            : 'py-4 px-4 grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 border-transparent'
        }`}
        role="tablist"
        aria-label="統計表示タブ"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeStatsTab === 'works'}
          onClick={() => setActiveStatsTab('works')}
          className={`card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 text-left transition-all ${
            activeStatsTab === 'works' ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'
          } ${isScrolled ? 'p-2' : 'p-4'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p
                className={`font-medium text-primary-600 uppercase tracking-wide transition-all ${isScrolled ? 'text-xs leading-tight' : 'text-sm'}`}
              >
                タスク数
              </p>
              <p
                className={`font-bold text-primary-900 transition-all ${isScrolled ? 'text-xl mt-0.5' : 'text-4xl mt-2'}`}
              >
                {validWorksCount}
              </p>
              {!isScrolled && (
                <p className="text-xs text-primary-600 mt-2">
                  個のシャッフル対象が登録されています
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <div
                className={`flex items-center justify-center rounded-lg bg-primary-200 transition-all ${isScrolled ? 'h-8 w-8' : 'h-14 w-14'}`}
              >
                <ClipboardDocumentListIcon
                  className={`text-primary-700 transition-all ${isScrolled ? 'h-4 w-4' : 'h-8 w-8'}`}
                />
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeStatsTab === 'members'}
          onClick={() => setActiveStatsTab('members')}
          className={`card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-left transition-all ${
            activeStatsTab === 'members' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
          } ${isScrolled ? 'p-2' : 'p-4'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p
                className={`font-medium text-blue-600 uppercase tracking-wide transition-all ${isScrolled ? 'text-xs leading-tight' : 'text-sm'}`}
              >
                メンバー数
              </p>
              <p
                className={`font-bold text-blue-900 transition-all ${isScrolled ? 'text-xl mt-0.5' : 'text-4xl mt-2'}`}
              >
                {assignedMembersCount}
              </p>
              {!isScrolled && <p className="text-xs text-blue-600 mt-2">人が参加しています</p>}
            </div>
            <div className="flex-shrink-0">
              <div
                className={`flex items-center justify-center rounded-lg bg-blue-200 transition-all ${isScrolled ? 'h-8 w-8' : 'h-14 w-14'}`}
              >
                <UserGroupIcon
                  className={`text-blue-700 transition-all ${isScrolled ? 'h-4 w-4' : 'h-8 w-8'}`}
                />
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeStatsTab === 'assigned'}
          onClick={() => setActiveStatsTab('assigned')}
          className={`card bg-gradient-to-br from-green-50 to-green-100 border border-green-200 text-left transition-all ${
            activeStatsTab === 'assigned' ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'
          } ${isScrolled ? 'p-2' : 'p-4'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p
                className={`font-medium text-green-600 uppercase tracking-wide transition-all ${isScrolled ? 'text-xs leading-tight' : 'text-sm'}`}
              >
                割り当て済み
              </p>
              <p
                className={`font-bold text-green-900 transition-all ${isScrolled ? 'text-xl mt-0.5' : 'text-4xl mt-2'}`}
              >
                {assignedMembersCount}
              </p>
              {!isScrolled && (
                <p className="text-xs text-green-600 mt-2">人が割り当てられています</p>
              )}
            </div>
            <div className="flex-shrink-0">
              <div
                className={`flex items-center justify-center rounded-lg bg-green-200 transition-all ${isScrolled ? 'h-8 w-8' : 'h-14 w-14'}`}
              >
                <CheckCircleIcon
                  className={`text-green-700 transition-all ${isScrolled ? 'h-4 w-4' : 'h-8 w-8'}`}
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {showParticipantSection && (
        <div className="card" role="tabpanel">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h3 className="text-lg font-semibold text-gray-900">参加メンバー選択</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllParticipants}
                className="btn-secondary text-sm px-3 py-1"
                disabled={activeMembers.length === 0}
              >
                全選択
              </button>
              <button
                type="button"
                onClick={handleClearAllParticipants}
                className="btn-secondary text-sm px-3 py-1"
                disabled={selectedMembersCount === 0}
              >
                全解除
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            参加中: {assignedMembersCount}/{activeMembers.length}人
          </p>

          {activeMembers.length === 0 ? (
            <p className="text-sm text-gray-500">参加可能なメンバーがいません。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeMembers.map((member: Member) => {
                // その日に割り当てられているか（履歴に記録されているか）で判定
                const checked = histories.some((h: History) => h.member_id === member.id);
                return (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      checked
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleParticipant(member.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-800">{member.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Works Exclusion List (for Works Tab) */}
      {activeStatsTab === 'works' && (
        <div className="card" role="tabpanel">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h3 className="text-lg font-semibold text-gray-900">タスク管理</h3>
            <p className="text-sm text-gray-600">
              シャッフル対象: {validWorksCount}/{works.length}個
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            シャッフルから除外したいタスクにチェックを入れてください。チェックされたタスクはシャッフル対象から外れます。
          </p>

          {works.length === 0 ? (
            <p className="text-sm text-gray-500">タスクが登録されていません。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {works.map((work: Work) => {
                const isExcluded = !work.is_above;
                return (
                  <label
                    key={work.id}
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                      isExcluded
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={() => handleToggleWorkExclusion(work.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{work.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {isExcluded ? '除外中' : 'シャッフル対象'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Works List Section */}
      {showWorksSection && (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center">
              <SparklesIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                {formatDate(selectedDate)}のタスク
              </h2>
            </div>
          </div>

          {works.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">タスクが登録されていません</p>
              <p className="text-gray-400 text-sm mt-2">「タスク」ページから追加してください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Unassigned Members Card */}
              <div className="border border-gray-300 rounded-xl p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:shadow-md transition-all">
                <div className="mb-4">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-gray-900">未割り当て</h3>
                  </div>
                </div>

                {unassignedMembers.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600">
                      全ての参加メンバーが割り当てられています
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-3">
                      未割り当ての参加メンバー:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unassignedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 bg-white border-2 border-yellow-300 rounded-lg hover:shadow-md transition-all flex items-center justify-center"
                        >
                          <p className="font-semibold text-gray-900 text-center">{member.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {works.map((work) => {
                const todayAssignments = getTodayAssignedMembers(work.id);
                const isExcluded = !work.is_above;
                return (
                  <div
                    key={work.id}
                    className={`border border-gray-200 rounded-xl p-5 bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition-all ${
                      isExcluded ? 'opacity-60 border-red-300' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <div
                            className={`h-3 w-3 rounded-full mr-3 ${isExcluded ? 'bg-red-500' : 'bg-primary-600'}`}
                          ></div>
                          <h3 className="text-lg font-semibold text-gray-900">{work.name}</h3>
                          {isExcluded && (
                            <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-small bg-red-100 text-red-700">
                              除外中
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                          今日の割り当て: {todayAssignments.length}人
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleShuffle(work.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          shuffling === work.id || assignedMembersCount === 0 || isExcluded
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 pointer-events-auto'
                            : 'btn-primary'
                        }`}
                        title={
                          isExcluded
                            ? 'このタスクはシャッフル対象から除外されています'
                            : assignedMembersCount === 0
                              ? 'メンバーを1人以上選択してください'
                              : ''
                        }
                      >
                        {shuffling === work.id ? '処理中...' : 'このタスクをシャッフル'}
                      </button>
                    </div>

                    {todayAssignments.length > 0 ? (
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-semibold text-gray-600 mb-3">
                          本日の割り当てメンバー:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {todayAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              onClick={() =>
                                handleOpenAssignMemberModal(assignment.member?.name || '', work.id)
                              }
                              className="p-4 bg-white border-2 border-primary-300 rounded-lg hover:bg-primary-50 hover:border-primary-500 cursor-pointer transition-all flex items-center justify-center"
                              title="クリックで割り当て先を変更"
                            >
                              <p className="font-semibold text-gray-900 text-center">
                                {assignment.member?.name}
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
