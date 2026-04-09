/// <reference types="vitest/globals" />
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Works from '../../../components/pages/Works';

vi.mock('axios');

const mockWorksForUIRefactor = [
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
  {
    id: 3,
    name: '除雪',
    multiple: 1,
    archive: true,
    is_above: true,
    created_at: '2026-01-03',
    updated_at: '2026-01-03',
  },
];

describe('Works - UI 刷新テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/v1/works')) {
        return Promise.resolve({ data: mockWorksForUIRefactor.filter((w) => !w.archive) });
      }
      return Promise.resolve({ data: [] });
    });
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('一括登録機能', () => {
    it('一括登録ボタンが表示される', async () => {
      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });
    });

    it('一括登録を押すと複数割り当て数の入力欄が表示される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /一括登録/ }));

      // テキストフィールド（当番名）
      expect(screen.getByPlaceholderText(/改行で複数登録/)).toBeInTheDocument();

      // 複数割り当て数の入力欄
      expect(screen.getByLabelText(/割り当て数/)).toBeInTheDocument();
    });

    it('改行区切りで複数当番を登録できる', async () => {
      const user = userEvent.setup();
      (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { created_count: 2, failed_count: 0 },
      });

      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /一括登録/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /一括登録/ }));

      const nameField = screen.getByPlaceholderText(/改行で複数登録/);
      await user.type(nameField, 'トイレ掃除\nゴミ捨て');

      // 複数割り当て数を入力
      const multipleInputs = screen.getAllByRole('spinbutton', { name: /割り当て数/ });
      expect(multipleInputs.length).toBeGreaterThanOrEqual(2);

      await user.click(screen.getByRole('button', { name: /登録/ }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/works/bulk_create'),
          expect.any(Object)
        );
      });
    });
  });

  describe('当番編集モーダル', () => {
    it('当番を押すと編集モーダルが開く', async () => {
      const user = userEvent.setup();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url.includes('/api/v1/works')) {
          return Promise.resolve({ data: mockWorksForUIRefactor });
        }
        return Promise.resolve({ data: [] });
      });

      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /掃除/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /掃除/ }));

      // 編集フォームが表示される
      expect(screen.getByDisplayValue(/掃除/)).toBeInTheDocument();
    });

    it('モーダルで当番名を編集できる', async () => {
      const user = userEvent.setup();
      (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 1, name: 'トイレ掃除', multiple: 1, archive: false, is_above: true },
      });

      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /掃除/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /掃除/ }));

      const nameInput = screen.getByDisplayValue(/掃除/);
      await user.clear(nameInput);
      await user.type(nameInput, 'トイレ掃除');

      await user.click(screen.getByRole('button', { name: /保存/ }));

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining('/works/1'),
          expect.objectContaining({
            work: expect.objectContaining({ name: 'トイレ掃除' }),
          })
        );
      });
    });

    it('複数割り当て数を編集できる', async () => {
      const user = userEvent.setup();
      (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 1, name: '掃除', multiple: 3, archive: false, is_above: true },
      });

      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /掃除/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /掃除/ }));

      const multipleInput = screen.getByDisplayValue('1');
      await user.clear(multipleInput);
      await user.type(multipleInput, '3');

      await user.click(screen.getByRole('button', { name: /保存/ }));

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining('/works/1'),
          expect.objectContaining({
            work: expect.objectContaining({ multiple: 3 }),
          })
        );
      });
    });

    it('以上/以下を切り替えられる', async () => {
      const user = userEvent.setup();
      (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 1, name: '掃除', multiple: 1, archive: false, is_above: false },
      });

      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /掃除/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /掃除/ }));

      const toggleButton = screen.getByRole('button', { name: /以上|以下/ });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining('/works/1'),
          expect.objectContaining({
            work: expect.objectContaining({ is_above: false }),
          })
        );
      });
    });

    it('アーカイブ状態を切り替えられる', async () => {
      const user = userEvent.setup();
      (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 1, name: '掃除', multiple: 1, archive: true, is_above: true },
      });

      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /掃除/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /掃除/ }));

      const archiveButton = screen.getByRole('button', { name: /アーカイブ/ });
      await user.click(archiveButton);

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining('/works/1'),
          expect.objectContaining({
            work: expect.objectContaining({ archive: true }),
          })
        );
      });
    });
  });

  describe('アーカイブフィルタリング', () => {
    it('フィルタリングドロップダウンが表示される', async () => {
      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('有効のみ')).toBeInTheDocument();
      });
    });

    it('「全て表示」でアーカイブを含めて表示', async () => {
      const user = userEvent.setup();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (url: string, config?: Record<string, unknown>) => {
          if (url.includes('/api/v1/works')) {
            const filter =
              (config?.params as Record<string, string> | undefined)?.filter || 'active';
            if (filter === 'all') {
              return Promise.resolve({ data: mockWorksForUIRefactor });
            }
            return Promise.resolve({ data: mockWorksForUIRefactor.filter((w) => !w.archive) });
          }
          return Promise.resolve({ data: [] });
        }
      );

      render(<Works worksheetId={null} />);

      const filterSelect = screen.getByDisplayValue('有効のみ');
      await user.selectOptions(filterSelect, '全て表示');

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/works'),
          expect.objectContaining({
            params: expect.objectContaining({ filter: 'all' }),
          })
        );
      });
    });

    it('「アーカイブのみ」でアーカイブのみ表示', async () => {
      const user = userEvent.setup();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (url: string, config?: Record<string, unknown>) => {
          if (url.includes('/api/v1/works')) {
            const filter =
              (config?.params as Record<string, string> | undefined)?.filter || 'active';
            if (filter === 'archived') {
              return Promise.resolve({ data: mockWorksForUIRefactor.filter((w) => w.archive) });
            }
            return Promise.resolve({ data: mockWorksForUIRefactor.filter((w) => !w.archive) });
          }
          return Promise.resolve({ data: [] });
        }
      );

      render(<Works worksheetId={null} />);

      const filterSelect = screen.getByDisplayValue('有効のみ');
      await user.selectOptions(filterSelect, 'アーカイブのみ');

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/works'),
          expect.objectContaining({
            params: expect.objectContaining({ filter: 'archived' }),
          })
        );
      });
    });
  });
});
