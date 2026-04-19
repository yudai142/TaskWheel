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

  describe('タスク一覧の表示', () => {
    it('タスク一覧が正しく表示される', async () => {
      render(<Works worksheetId={1} />);

      await waitFor(() => {
        mockWorks.forEach((work) => {
          expect(screen.getByText(work.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe('タスク編集機能', () => {
    it('タスクカードをクリックすると編集フォーム＆メンバー設定パネルが表示される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // タスクが表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // タスクカードをクリック
      await user.click(screen.getByRole('button', { name: new RegExp(mockWorks[0].name) }));

      // 左側：編集フォームが表示される
      expect(screen.getByText('タスクを編集')).toBeInTheDocument();
      expect(screen.getByLabelText('タスク名')).toBeInTheDocument();
      expect(screen.getByLabelText('複数割り当て数')).toBeInTheDocument();

      // 右側：メンバー設定パネルが表示される
      expect(screen.getByText('メンバー固定/除外設定を追加')).toBeInTheDocument();
      expect(screen.getByLabelText('メンバー名')).toBeInTheDocument();
      expect(screen.getByLabelText('設定種別')).toBeInTheDocument();
    });

    it('編集フォームでタスクを保存できる', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // タスクが表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // タスクカードをクリック
      await user.click(screen.getByRole('button', { name: new RegExp(mockWorks[0].name) }));

      // タスク名を変更
      const nameInput = screen.getByLabelText('タスク名') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, '新しいタスク名');

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // API呼び出しを確認
      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          `/api/v1/works/${mockWorks[0].id}`,
          expect.objectContaining({
            work: expect.objectContaining({
              name: '新しいタスク名',
            }),
          })
        );
      });

      // モーダルが閉じる
      await waitFor(() => {
        expect(screen.queryByText('タスクを編集')).not.toBeInTheDocument();
      });
    });

    it('編集フォームでエンターキーを押してもモーダルが閉じない', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Works worksheetId={1} />);

      // タスクが表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // タスクカードをクリック
      await user.click(screen.getByRole('button', { name: new RegExp(mockWorks[0].name) }));

      // モーダルが開く
      await waitFor(() => {
        expect(screen.getByText('タスクを編集')).toBeInTheDocument();
      });

      // タスク名入力フィールドにフォーカスしてエンターキーを押す
      const nameInput = screen.getByLabelText('タスク名') as HTMLInputElement;
      await user.click(nameInput);
      await user.keyboard('{Enter}');

      // モーダルがまだ開いていることを確認
      expect(screen.getByText('タスクを編集')).toBeInTheDocument();

      // API 呼び出しがされていないことを確認（エンターキーではsubmitされない）
      expect(axios.patch).not.toHaveBeenCalled();
    });

    it('複数割り当て数フィールドでエンターキーを押してもモーダルが閉じない', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Works worksheetId={1} />);

      // タスクが表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // タスクカードをクリック
      await user.click(screen.getByRole('button', { name: new RegExp(mockWorks[0].name) }));

      // モーダルが開く
      await waitFor(() => {
        expect(screen.getByText('タスクを編集')).toBeInTheDocument();
      });

      // 複数割り当て数入力フィールドにフォーカスしてエンターキーを押す
      const multipleInput = screen.getByLabelText('複数割り当て数') as HTMLInputElement;
      await user.click(multipleInput);
      await user.keyboard('{Enter}');

      // モーダルがまだ開いていることを確認
      expect(screen.getByText('タスクを編集')).toBeInTheDocument();

      // API 呼び出しがされていないことを確認
      expect(axios.patch).not.toHaveBeenCalled();
    });
  });

  describe('タスク作成機能', () => {
    it('新規追加ボタンでタスク作成フォームが表示される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // API 呼び出しと一覧表示を待機
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // タスクが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // 新規追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: /一括追加/ });
      await user.click(addButton);

      // フォーム内のタスク名ラベルを確認
      const labels = screen.getAllByText('タスクを一括登録');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('タスクを作成すると、データが再取得される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      // API 呼び出しを待機
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // タスクが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(mockWorks[0].name)).toBeInTheDocument();
      });

      // 新規追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: /一括追加/ });
      await user.click(addButton);

      // テキストエリアにテストタスクを入力
      const textarea = screen.getByRole('textbox', { name: /タスクを一括登録/ });
      await user.type(textarea, 'テストタスク');

      // 一括追加ボタンをクリック
      const submitButton = screen.getByRole('button', { name: /一括追加/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/works/bulk_create', expect.any(Object));
      });
    });
  });
});
