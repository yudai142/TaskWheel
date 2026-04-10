import axios from 'axios';
import type { History, Member, Work } from '../../types';
import {
  mockWorks,
  mockMembers,
  mockHistories,
  mockMembersWithArchived,
  mockMembersForManagement,
  mockHistoriesYesterday,
  mockDataSets,
} from './mockData';

/**
 * テスト用axiosモック設定
 */

/**
 * 共通のモック設定関数
 * GET と PATCH メソッドをセットアップ
 */
type AxiosMockConfig = {
  params?: Record<string, string>;
};

type MockedAxios = {
  get: {
    mockImplementation: (
      fn: (url: string, config?: AxiosMockConfig) => Promise<{ data: unknown }>
    ) => void;
  };
  patch: {
    mockImplementation: (fn: (url: string, _data: unknown) => Promise<{ data: unknown }>) => void;
  };
  post: {
    mockImplementation: (fn: (url: string, _data: unknown) => Promise<{ data: unknown }>) => void;
  };
};

const setupCommonMocks = (works: Work[], members: Member[], histories: History[]) => {
  const mockedAxios = axios as unknown as MockedAxios;

  mockedAxios.get.mockImplementation((url: string, config?: AxiosMockConfig) => {
    if (url === '/api/v1/works') {
      return Promise.resolve({ data: works });
    }
    if (url === '/api/v1/members') {
      if (config?.params?.include_archived === 'true') {
        return Promise.resolve({ data: mockMembersForManagement });
      }
      return Promise.resolve({ data: members });
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: histories });
    }
    return Promise.resolve({ data: [] });
  });

  mockedAxios.patch.mockImplementation((url: string, data: unknown) => {
    // 当番更新のモック
    if (url.includes('/api/v1/works/')) {
      const id = parseInt(url.split('/').pop() || '', 10);
      const workToUpdate = works.find((w) => w.id === id);
      if (
        workToUpdate &&
        typeof data === 'object' &&
        data !== null &&
        'work' in data &&
        typeof (data as Record<string, unknown>).work === 'object' &&
        (data as Record<string, unknown>).work !== null
      ) {
        const workUpdate = (data as Record<string, unknown>).work as Record<string, unknown>;
        const updatedWork = { ...workToUpdate, ...workUpdate };
        return Promise.resolve({ data: updatedWork });
      }
      return Promise.resolve({ data: workToUpdate || {} });
    }
    return Promise.resolve({ data: {} });
  });

  // POST メソッドのモック（シャッフル時など）
  mockedAxios.post.mockImplementation((url: string, _data: unknown) => {
    if (url.includes('/api/v1/works/shuffle')) {
      return Promise.resolve({ data: [] });
    }
    if (url.includes('/api/v1/histories')) {
      return Promise.resolve({ data: {} });
    }
    return Promise.resolve({ data: {} });
  });
};

// デフォルトのaxiosモック設定
export const setupDefaultAxiosMocks = () => {
  setupCommonMocks(mockWorks, mockMembers, mockHistories);
};

// カスタムデータセット用のaxiosモック設定
export const setupAxiosMocksWithData = (dataSet: typeof mockDataSets.today) => {
  setupCommonMocks(dataSet.works, dataSet.members, dataSet.histories);
};

// アーカイブメンバーを含むモックデータでセットアップ
export const setupAxiosMocksWithArchived = () => {
  setupCommonMocks(mockWorks, mockMembersWithArchived, mockHistories);
};

// 昨日のデータでセットアップ
export const setupAxiosMocksYesterday = () => {
  setupCommonMocks(mockWorks, mockMembers, mockHistoriesYesterday);
};
