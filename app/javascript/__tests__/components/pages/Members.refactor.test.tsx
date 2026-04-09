/// <reference types="vitest/globals" />
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Members from '../../../components/pages/Members';
import { setDefaultAxiosMocks } from '../../../spec/fixtures/axiosMocks';

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
    setDefaultAxiosMocks();
  });

  describe('一括登録機能', () => {
    it('一括登録ボタンが表示される', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });
    });

    it('一括登録を押すとテキストフィールドが表示される', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /一括登録/ }));

      expect(screen.getByPlaceholderText(/改行で複数登録/)).toBeInTheDocument();
    });

    it('改行区切りで複数メンバーを登録できる', async () => {
      const user = userEvent.setup();
      (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { created_count: 2, failed_count: 0 },
      });

      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /一括登録/ }));

      const nameField = screen.getByPlaceholderText(/改行で複数登録/);
      await user.type(nameField, '鈴木花子\n伊藤次郎');

      await user.click(screen.getByRole('button', { name: /登録/ }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/members/bulk_create'),
          expect.any(Object)
        );
      });
    });
  });

  describe('ふりがな自動予測', () => {
    it('名前入力時にふりがなが自動入力される', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /新規追加/ }));

      const nameInput = screen.getByLabelText(/名前/);
      await user.type(nameInput, '山田太郎');

      const kanaInput = screen.getByLabelText(/ふりがな/);
      // 自動予測されることを確認
      expect(kanaInput).toHaveValue(expect.stringContaining('ヤマダ'));
    });
  });

  describe('メンバー編集', () => {
    it('メンバーを押すと編集モーダルが開く', async () => {
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

      // 編集フォームが表示される
      const nameInputs = screen.getAllByDisplayValue(/山田太郎/);
      expect(nameInputs.length).toBeGreaterThan(0);
    });

    it('モーダルで名前とふりがなを編集できる', async () => {
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
        data: { id: 1, name: '佐藤太郎', kana: 'サトウタロウ', archive: false },
      });

      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /山田太郎/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /山田太郎/ }));

      // 名前を編集
      const nameInputs = screen.getAllByDisplayValue(/山田太郎/);
      await user.clear(nameInputs[0]);
      await user.type(nameInputs[0], '佐藤太郎');

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
        (url: string, config?: Record<string, unknown>) => {
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
        expect(screen.getByDisplayValue('有効のみ')).toBeInTheDocument();
      });
    });

    it('「有効のみ」でフィルタできる', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /山田太郎/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /新田葉男/ })).not.toBeInTheDocument();
      });
    });

    it('「全て表示」でアーカイブを含めて表示', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      const filterSelect = screen.getByDisplayValue('有効のみ');
      await user.selectOptions(filterSelect, '全て表示');

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members'),
          expect.objectContaining({
            params: expect.objectContaining({ filter: 'all' }),
          })
        );
      });
    });

    it('「アーカイブのみ」でアーカイブのみ表示', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      const filterSelect = screen.getByDisplayValue('有効のみ');
      await user.selectOptions(filterSelect, 'アーカイブのみ');

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
