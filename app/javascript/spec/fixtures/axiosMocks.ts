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

// デフォルトのaxiosモック設定
export const setupDefaultAxiosMocks = () => {
  ;(axios.get as any).mockImplementation((url: string) => {
    if (url === '/api/v1/works') {
      return Promise.resolve({ data: mockWorks })
    }
    if (url === '/api/v1/members') {
      return Promise.resolve({ data: mockMembers })
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: mockHistories })
    }
    return Promise.resolve({ data: [] })
  })
}

// カスタムデータセット用のaxiosモック設定
export const setupAxiosMocksWithData = (dataSet: typeof mockDataSets.today) => {
  ;(axios.get as any).mockImplementation((url: string) => {
    if (url === '/api/v1/works') {
      return Promise.resolve({ data: dataSet.works })
    }
    if (url === '/api/v1/members') {
      return Promise.resolve({ data: dataSet.members })
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: dataSet.histories })
    }
    return Promise.resolve({ data: [] })
  })
}

// アーカイブメンバーを含むモックデータでセットアップ
export const setupAxiosMocksWithArchived = () => {
  ;(axios.get as any).mockImplementation((url: string) => {
    if (url === '/api/v1/works') {
      return Promise.resolve({ data: mockWorks })
    }
    if (url === '/api/v1/members') {
      return Promise.resolve({ data: mockMembersWithArchived })
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: mockHistories })
    }
    return Promise.resolve({ data: [] })
  })
}

// 昨日のデータでセットアップ
export const setupAxiosMocksYesterday = () => {
  ;(axios.get as any).mockImplementation((url: string) => {
    if (url === '/api/v1/works') {
      return Promise.resolve({ data: mockWorks })
    }
    if (url === '/api/v1/members') {
      return Promise.resolve({ data: mockMembers })
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: mockHistoriesYesterday })
    }
    return Promise.resolve({ data: [] })
  })
}
