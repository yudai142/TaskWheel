/// <reference types="vitest/globals" />
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Members from '../../../components/pages/Members';

vi.mock('axios');

const mockMembersForUIRefactor = [
  {
    id: 1,
    name: '山田太郎',
    kana: 'ヤマダタロウ',
    archive: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    settings: [],
  },
  {
    id: 2,
    name: '佐藤次郎',
    kana: 'サトウジロウ',
    archive: false,
    created_at: '2026-01-02',
    updated_at: '2026-01-02',
    settings: [],
  },
  {
    id: 3,
    name: '新田葉男',
    kana: 'ニッタハオ',
    archive: true,
    created_at: '2026-01-03',
    updated_at: '2026-01-03',
    settings: [],
  },
];

const mockWorks = [
  {
    id: 1,
    name: '掃除',
    multiple: 1,
    archive: false,
    is_above: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 2,
    name: 'ゴミ捨て',
    multiple: 2,
    archive: false,
    is_above: false,
    created_at: '2026-01-02',
    updated_at: '2026-01-02',
  },
];

describe('Members - UI 刷新テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトの mock 設定
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/v1/members')) {
        return Promise.resolve({ data: mockMembersForUIRefactor.filter((m) => !m.archive) });
      }
      if (url.includes('/api/v1/works')) {
        return Promise.resolve({ data: mockWorks });
      }
      return Promise.resolve({ data: [] });
    });
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('一括登録機能', () => {
    it('一括登録ボタンが表示される', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括追加/ })).toBeInTheDocument();
      });
    });

    it('一括追加を押すとテキストエリアが表示される', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括追加/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /一括追加/ }));

      expect(screen.getByLabelText(/メンバーを一括登録/)).toBeInTheDocument();
    });

    it('改行区切りで複数メンバーを登録できる', async () => {
      const user = userEvent.setup();
      (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [
          { id: 4, name: '鈴木花子', kana: 'スズキハナコ', archive: false },
          { id: 5, name: '伊藤次郎', kana: 'イトウジロウ', archive: false },
        ],
      });

      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括追加/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /一括追加/ }));

      const textarea = screen.getByLabelText(/メンバーを一括登録/);
      await user.type(textarea, '鈴木 花子 スズキ ハナコ\n伊藤 次郎 イトウ ジロウ');

      await user.click(screen.getByRole('button', { name: /一括追加/ }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members/bulk_create'),
          expect.any(Object)
        );
      });
    });
  });

  describe('メンバー編集', () => {
    it('メンバーを押すと詳細モーダルが開く', async () => {
      const user = userEvent.setup();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url.includes('/api/v1/members')) {
          return Promise.resolve({ data: mockMembersForUIRefactor });
        }
        if (url.includes('/api/v1/works')) {
          return Promise.resolve({ data: mockWorks });
        }
        return Promise.resolve({ data: [] });
      });

      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /山田太郎/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /山田太郎/ }));

      // 詳細モーダルが表示されて編集ボタンがある
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /編集/ })).toBeInTheDocument();
      });
    });

    it('編集ボタンを押すと編集フォームが表示される', async () => {
      const user = userEvent.setup();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url.includes('/api/v1/members')) {
          return Promise.resolve({ data: mockMembersForUIRefactor });
        }
        if (url.includes('/api/v1/works')) {
          return Promise.resolve({ data: mockWorks });
        }
        return Promise.resolve({ data: [] });
      });

      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /山田太郎/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /山田太郎/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /編集/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /編集/ }));

      // 編集フォームが表示される
      const nameInput = screen.getByDisplayValue('山田太郎');
      expect(nameInput).toBeInTheDocument();
    });

    it('モーダルで名前とかなを編集できる', async () => {
      const user = userEvent.setup();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url.includes('/api/v1/members')) {
          return Promise.resolve({ data: mockMembersForUIRefactor });
        }
        if (url.includes('/api/v1/works')) {
          return Promise.resolve({ data: mockWorks });
        }
        return Promise.resolve({ data: [] });
      });
      (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          id: 1,
          name: '佐藤太郎',
          kana: 'サトウタロウ',
          archive: false,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      });

      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /山田太郎/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /山田太郎/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /編集/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /編集/ }));

      // 名前を編集
      const allInputs = screen.queryAllByDisplayValue(/山田太郎/);
      const nameInput = allInputs.find((el) => el.getAttribute('id') === 'edit-name');
      if (!nameInput) throw new Error('Name input not found');

      await user.clear(nameInput);
      await user.type(nameInput, '佐藤太郎');

      await user.click(screen.getByRole('button', { name: /保存/ }));

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining('/members/1'),
          expect.objectContaining({
            member: expect.objectContaining({ name: '佐藤太郎' }),
          })
        );
      });
    });
  });

  describe('アーカイブフィルタリング', () => {
    beforeEach(() => {
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (url: string, config?: { params?: Record<string, unknown> }) => {
          if (url.includes('/api/v1/members')) {
            const filter =
              (config?.params as Record<string, string> | undefined)?.filter || 'active';
            let filtered = mockMembersForUIRefactor;

            if (filter === 'active') {
              filtered = mockMembersForUIRefactor.filter((m) => !m.archive);
            } else if (filter === 'archived') {
              filtered = mockMembersForUIRefactor.filter((m) => m.archive);
            }

            return Promise.resolve({ data: filtered });
          }
          if (url.includes('/api/v1/works')) {
            return Promise.resolve({ data: mockWorks });
          }
          return Promise.resolve({ data: [] });
        }
      );
    });

    it('フィルタリングドロップダウンが表示される', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('有効なメンバー')).toBeInTheDocument();
      });
    });

    it('「有効なメンバー」でアーカイブを除外して表示', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /山田太郎/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /新田葉男/ })).not.toBeInTheDocument();
      });
    });

    it('「すべて」でアーカイブを含めて表示', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('有効なメンバー')).toBeInTheDocument();
      });

      const filterSelect = screen.getByDisplayValue('有効なメンバー');
      await user.selectOptions(filterSelect, 'all');

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members'),
          expect.objectContaining({
            params: expect.objectContaining({ filter: 'all' }),
          })
        );
      });
    });

    it('「アーカイブ」でアーカイブのみ表示', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('有効なメンバー')).toBeInTheDocument();
      });

      const filterSelect = screen.getByDisplayValue('有効なメンバー');
      await user.selectOptions(filterSelect, 'archived');

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members'),
          expect.objectContaining({
            params: expect.objectContaining({ filter: 'archived' }),
          })
        );
      });
    });
  });
});
