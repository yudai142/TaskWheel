import { vi } from 'vitest'
import axios from 'axios'
import {
  mockWorks,
  mockMembers,
  mockHistories,
  mockMembersWithArchived,
  mockHistoriesYesterday,
  mockDataSets,
} from './mockData'

/**
 * テスト用axiosモック設定
 */

/**
 * 共通のモック設定関数
 * GET と PATCH メソッドをセットアップ
 */
const setupCommonMocks = (works: any, members: any, histories: any) => {
  ;(axios.get as any).mockImplementation((url: string) => {
    if (url === '/api/v1/works') {
      return Promise.resolve({ data: works })
    }
    if (url === '/api/v1/members') {
      return Promise.resolve({ data: members })
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: histories })
    }
    return Promise.resolve({ data: [] })
  })

  ;(axios.patch as any).mockImplementation((url: string, data: any) => {
    // シャッフル除外機能のモック
    if (url.includes('/api/v1/works/')) {
      return Promise.resolve({ data: { success: true } })
    }
    return Promise.resolve({ data: {} })
  })

  // POST メソッドのモック（シャッフル時など）
  ;(axios.post as any).mockImplementation((url: string, data: any) => {
    if (url.includes('/api/v1/works/shuffle')) {
      return Promise.resolve({ data: [] })
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: {} })
    }
    return Promise.resolve({ data: {} })
  })
}

// デフォルトのaxiosモック設定
export const setupDefaultAxiosMocks = () => {
  setupCommonMocks(mockWorks, mockMembers, mockHistories)
}

// カスタムデータセット用のaxiosモック設定
export const setupAxiosMocksWithData = (dataSet: typeof mockDataSets.today) => {
  setupCommonMocks(dataSet.works, dataSet.members, dataSet.histories)
}

// アーカイブメンバーを含むモックデータでセットアップ
export const setupAxiosMocksWithArchived = () => {
  setupCommonMocks(mockWorks, mockMembersWithArchived, mockHistories)
}

// 昨日のデータでセットアップ
export const setupAxiosMocksYesterday = () => {
  setupCommonMocks(mockWorks, mockMembers, mockHistoriesYesterday)
}

