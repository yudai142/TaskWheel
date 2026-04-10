import type { Member, Work, History, MemberOptionSetting } from '../../types';

/**
 * テスト用モックデータ定義
 * Issue #2 ダッシュボード統計表示タブUIのテスト用データ
 */

// タスク（掃除タスク）のモックデータ
export const mockWorks: Work[] = [
  {
    id: 1,
    name: '掃除A',
    archive: false,
    is_above: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 2,
    name: '掃除B',
    archive: false,
    is_above: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 3,
    name: '掃除C',
    archive: false,
    is_above: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
];

// メンバーのモックデータ
export const mockMembers: Member[] = [
  {
    id: 1,
    name: 'Yamada Taro',
    kana: 'ヤマダ タロウ',
    archive: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 2,
    name: 'Tanaka Hanako',
    kana: 'タナカ ハナコ',
    archive: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 3,
    name: 'Suzuki Jiro',
    kana: 'スズキ ジロウ',
    archive: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
];

export const mockMemberOptionSettings: MemberOptionSetting[] = [
  { id: 1, member_id: 1, work_id: 1, work_name: '掃除A', status: 0, status_label: '固定' },
  { id: 2, member_id: 1, work_id: 2, work_name: '掃除B', status: 1, status_label: '除外' },
];

export const mockMembersForManagement: Member[] = [
  {
    id: 1,
    name: 'Yamada Taro',
    kana: 'ヤマダ タロウ',
    archive: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
    member_options: mockMemberOptionSettings,
  },
  {
    id: 2,
    name: 'Tanaka Hanako',
    kana: 'タナカ ハナコ',
    archive: true,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
    member_options: [],
  },
];

// アーカイブ済みメンバーを含むモックデータ
export const mockMembersWithArchived: Member[] = [
  {
    id: 1,
    name: 'Yamada Taro',
    kana: 'ヤマダ タロウ',
    archive: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 2,
    name: 'Tanaka Hanako',
    kana: 'タナカ ハナコ',
    archive: false,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 3,
    name: 'Archived Member',
    kana: 'アーカイブ メンバー',
    archive: true,
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
];

// 割り当て履歴のモックデータ
export const mockHistories: History[] = [
  {
    id: 1,
    member_id: 1,
    work_id: 1,
    date: '2026-04-04',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 2,
    member_id: 2,
    work_id: 2,
    date: '2026-04-04',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
];

// 昨日の履歴
export const mockHistoriesYesterday: History[] = [
  {
    id: 3,
    member_id: 1,
    work_id: 1,
    date: '2026-04-03',
    created_at: '2026-04-03T00:00:00Z',
    updated_at: '2026-04-03T00:00:00Z',
  },
  {
    id: 4,
    member_id: 3,
    work_id: 3,
    date: '2026-04-03',
    created_at: '2026-04-03T00:00:00Z',
    updated_at: '2026-04-03T00:00:00Z',
  },
];

// 複数メンバーの複数割り当て（シャッフルテスト用）
export const mockHistoriesMultiple: History[] = [
  {
    id: 1,
    member_id: 1,
    work_id: 1,
    date: '2026-04-04',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 2,
    member_id: 2,
    work_id: 2,
    date: '2026-04-04',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 3,
    member_id: 3,
    work_id: 3,
    date: '2026-04-04',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
  {
    id: 4,
    member_id: 1,
    work_id: 2,
    date: '2026-04-04',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: '2026-04-04T00:00:00Z',
  },
];

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
};
