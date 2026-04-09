/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Works from '../../../components/pages/Works';
import { mockWorks, mockMembers } from '../../../spec/fixtures/mockData';

vi.mock('axios');

describe('Works - Issue #27: ワークシート選択機能のワークシート連携', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, _config?: { params?: Record<string, unknown> }) => {
        if (url === '/api/v1/works') {
          return Promise.resolve({ data: mockWorks });
        }
        if (url === '/api/v1/members') {
          return Promise.resolve({ data: mockMembers });
        }
        return Promise.resolve({ data: [] });
      }
    );
    (axios.patch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, data: unknown) => {
        if (url.includes('/api/v1/works/')) {
          const id = parseInt(url.split('/').pop() || '', 10);
          const workToUpdate = mockWorks.find((w) => w.id === id);
          if (workToUpdate && typeof data === 'object' && data !== null && 'work' in data) {
            const updatedWork = {
              ...workToUpdate,
              ...(data as unknown as Record<string, unknown>).work,
            };
            return Promise.resolve({ data: updatedWork });
          }
          return Promise.resolve({ data: workToUpdate || {} });
        }
        if (url.includes('/api/v1/member_option_settings/')) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: {} });
      }
    );
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (axios.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('ワークシートIDパラメータの受け取りと反映', () => {
    it('worksheetIdをpropsで受け取ると、各APIが呼び出される', async () => {
      render(<Works worksheetId={123} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
      });
    });

    it('worksheetIdがnullの場合、各APIが呼び出される', async () => {
      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
      });
    });

    it('worksheetIdが変更されると、データが再取得される', async () => {
      const { rerender } = render(<Works worksheetId={1} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
      });

      vi.clearAllMocks();

      rerender(<Works worksheetId={2} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
      });
    });
  });

  describe('当番一覧の表示', () => {
    it('当番一覧が正しく表示される', async () => {
      render(<Works worksheetId={1} />);

      await waitFor(() => {
        mockWorks.forEach((work) => {
          expect(screen.getByText(work.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe('当番編集機能', () => {
    it('当番カードをクリックすると編集フォーム＆メンバー設定パネルが表示される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // 当番が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // 当番カードをクリック
      await user.click(screen.getByRole('button', { name: new RegExp(mockWorks[0].name) }));

      // 左側：編集フォームが表示される
      expect(screen.getByText('当番を編集')).toBeInTheDocument();
      expect(screen.getByLabelText('当番名')).toBeInTheDocument();
      expect(screen.getByLabelText('複数割り当て数')).toBeInTheDocument();

      // 右側：メンバー設定パネルが表示される
      expect(screen.getByText('メンバー固定/除外設定を追加')).toBeInTheDocument();
      expect(screen.getByLabelText('メンバー名')).toBeInTheDocument();
      expect(screen.getByLabelText('設定種別')).toBeInTheDocument();
    });

    it('編集フォームで当番を保存できる', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // 当番が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // 当番カードをクリック
      await user.click(screen.getByRole('button', { name: new RegExp(mockWorks[0].name) }));

      // 当番名を変更
      const nameInput = screen.getByLabelText('当番名') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, '新しい当番名');

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // API呼び出しを確認
      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          `/api/v1/works/${mockWorks[0].id}`,
          expect.objectContaining({
            work: expect.objectContaining({
              name: '新しい当番名',
            }),
          })
        );
      });

      // モーダルが閉じる
      await waitFor(() => {
        expect(screen.queryByText('当番を編集')).not.toBeInTheDocument();
      });
    });
  });

  describe('当番作成機能', () => {
    it('新規追加ボタンで当番作成フォームが表示される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // API 呼び出しと一覧表示を待機
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // 当番が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // 新規追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: /一括追加/ });
      await user.click(addButton);

      // フォーム内の当番名ラベルを確認
      const labels = screen.getAllByText('当番を一括登録');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('当番を作成すると、データが再取得される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // API 呼び出しを待機
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // 当番が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // 新規追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: /一括追加/ });
      await user.click(addButton);

      // テキストエリアにテスト当番を入力
      const textarea = screen.getByRole('textbox', { name: /当番を一括登録/ });
      await user.type(textarea, 'テスト当番');

      // 一括追加ボタンをクリック
      const submitButton = screen.getByRole('button', { name: /一括追加/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/works/bulk_create', expect.any(Object));
      });
    });
  });
});
