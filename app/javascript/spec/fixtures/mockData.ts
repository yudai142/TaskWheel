import type { Member, Work, History } from '../../types'

/**
 * テスト用モックデータ定義
 * Issue #2 ダッシュボード統計表示タブUIのテスト用データ
 */

// 当番（掃除タスク）のモックデータ
export const mockWorks: Work[] = [
  { id: 1, title: '掃除A' },
  { id: 2, title: '掃除B' },
  { id: 3, title: '掃除C' },
]

// メンバーのモックデータ
export const mockMembers: Member[] = [
  { id: 1, first_name: 'Taro', last_name: 'Yamada', archive: false },
  { id: 2, first_name: 'Hanako', last_name: 'Tanaka', archive: false },
  { id: 3, first_name: 'Jiro', last_name: 'Suzuki', archive: false },
]

// アーカイブ済みメンバーを含むモックデータ
export const mockMembersWithArchived: Member[] = [
  { id: 1, first_name: 'Taro', last_name: 'Yamada', archive: false },
  { id: 2, first_name: 'Hanako', last_name: 'Tanaka', archive: false },
  { id: 3, first_name: 'Archived', last_name: 'Member', archive: true },
]

// 割り当て履歴のモックデータ
export const mockHistories: History[] = [
  { id: 1, member_id: 1, work_id: 1, date: '2026-04-04' },
  { id: 2, member_id: 2, work_id: 2, date: '2026-04-04' },
]

// 昨日の履歴
export const mockHistoriesYesterday: History[] = [
  { id: 3, member_id: 1, work_id: 1, date: '2026-04-03' },
  { id: 4, member_id: 3, work_id: 3, date: '2026-04-03' },
]

// 複数メンバーの複数割り当て（シャッフルテスト用）
export const mockHistoriesMultiple: History[] = [
  { id: 1, member_id: 1, work_id: 1, date: '2026-04-04' },
  { id: 2, member_id: 2, work_id: 2, date: '2026-04-04' },
  { id: 3, member_id: 3, work_id: 3, date: '2026-04-04' },
  { id: 4, member_id: 1, work_id: 2, date: '2026-04-04' },
]

// スマートなモックデータセット（複合テスト用）
export const mockDataSets = {
  today: {
    works: mockWorks,
    members: mockMembers,
    histories: mockHistories,
  },
  yesterday: {
    works: mockWorks,
    members: mockMembers,
    histories: mockHistoriesYesterday,
  },
  withArchived: {
    works: mockWorks,
    members: mockMembersWithArchived,
    histories: mockHistories,
  },
  multiple: {
    works: mockWorks,
    members: mockMembers,
    histories: mockHistoriesMultiple,
  },
}
