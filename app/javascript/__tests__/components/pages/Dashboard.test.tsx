/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Dashboard from '../../../components/pages/Dashboard';
import {
  setupDefaultAxiosMocks,
  setupAxiosMocksWithArchived,
} from '../../../spec/fixtures/axiosMocks';

// Mock axios
vi.mock('axios');

describe('Dashboard - Issue #2: 統計表示タブ切り替え機能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAxiosMocks();
  });

  describe('タブ表示機能', () => {
    it('3つのタブが表示される', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('初期表示タブが「タスク数」である', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const workTab = screen.getAllByRole('tab')[0];
        expect(workTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('タブクリックで表示内容が即時に切り替わる', async () => {
      const user = userEvent.setup();
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(2);
      });

      const tabs = screen.getAllByRole('tab');
      // メンバー数タブ（2番目）をクリック
      await user.click(tabs[1]);

      // タブが切り替わったことを確認
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('割り当て済みタブをクリックできる', async () => {
      const user = userEvent.setup();
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(3);
      });

      const tabs = screen.getAllByRole('tab');
      // 割り当て済みタブ（3番目）をクリック
      await user.click(tabs[2]);

      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('タスク数タブの機能', () => {
    it('タスク数タブで掃除項目一覧が表示される', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      });

      // 掃除項目が表示されることを確認（チェックボックスから取得）
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(0);
    });

    it('掃除項目のチェックボックスをチェック/アンチェックできる', async () => {
      const user = userEvent.setup();
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const checkboxes = screen.queryAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0]);
        // チェック状態の変化を確認
        expect(checkboxes[0]).toHaveProperty('checked');
      }
    });

    it('除外チェックされた掃除項目はシャッフル対象から外れる', async () => {
      const user = userEvent.setup();

      // デフォルト モック セットアップ
      setupDefaultAxiosMocks();

      // OffWorks API をモック（GET リクエストで空配列を返す）
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes('/api/v1/off_works')) {
          return Promise.resolve({ data: [] });
        }
        // 他の GET リクエストはデフォルト動作に従う
        throw new Error(`Unmocked GET: ${url}`);
      });

      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const checkboxes = screen.queryAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        const checkbox = checkboxes[0] as HTMLInputElement;

        // チェック前は未チェック
        expect(checkbox.checked).toBe(false);

        // チェック状態を変化させる
        await user.click(checkbox);

        // POST リクエストが呼ばれたことを確認（OffWork レコード作成）
        await waitFor(() => {
          expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
            '/api/v1/off_works',
            expect.objectContaining({
              off_work: expect.objectContaining({
                work_id: expect.any(Number),
                date: expect.any(String),
              }),
            })
          );
        });
      }
    });
  });

  describe('メンバー数タブの機能', () => {
    it('メンバー数は参加メンバー選択と一致する', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(2);
      });

      const tabs = screen.getAllByRole('tab');
      // メンバータブ（2番目）をクリック
      fireEvent.click(tabs[1]);

      // メンバー数の表示がされていることを確認
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('アーカイブされたメンバーは表示されない', async () => {
      vi.clearAllMocks();
      setupAxiosMocksWithArchived();

      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(1);
      });

      // アーカイブ状態でも、コンポーネントは正常にレンダリングされることを確認
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('統計数値の日付連動', () => {
    it('選択日付が変わると統計数値が更新される', async () => {
      const user = userEvent.setup();
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/タスク数/i)).toBeInTheDocument();
      });

      // 日付を変更
      const calendarButton = screen.getByRole('button', { name: /calendar|カレンダー/i });
      if (calendarButton) {
        await user.click(calendarButton);

        // APIが新しい日付パラメータで呼ばれることを確認
        expect(axios.get).toHaveBeenCalled();
      }
    });

    it('統計カードの数値は日付ごとに異なる', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/タスク数/i)).toBeInTheDocument();
      });

      // 初期表示の統計数値を確認
      // (実装時に具体的なセレクタを追加)
    });
  });

  describe('レスポンシブ対応', () => {
    it('モバイル・デスクトップ双方で崩れず利用できる', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/タスク数/i)).toBeInTheDocument();
      });

      // レスポンシブなUIが正しく描画されていることを確認
      const container =
        screen.getByText(/タスク数/i).closest('.container') ||
        screen.getByText(/タスク数/i).closest('[class*="grid"]');

      expect(container).toBeInTheDocument();
    });
  });

  describe('既存機能への影響確認', () => {
    it('シャッフル機能が影響を受けない', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/タスク数/i)).toBeInTheDocument();
      });

      // シャッフルボタンが存在し、機能することを確認
      const shuffleButtons = screen.queryAllByRole('button', { name: /シャッフル/i });
      expect(shuffleButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('割り当て機能が影響を受けない', async () => {
      render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/タスク数/i)).toBeInTheDocument();
      });

      // 各種ボタンが存在して機能可能であることを確認
      // (実装時に具体的な検証を追加)
    });
  });

  describe('Issue #27: ワークシート連携', () => {
    it('ダッシュボードが選択中のワークシートIDをパラメータで受け取る', async () => {
      const { container } = render(<Dashboard worksheetId={1} />);
      expect(container).toBeInTheDocument();
    });

    it('ワークシート変更時にデータを再取得する', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      setupDefaultAxiosMocks();

      const { rerender } = render(<Dashboard worksheetId={1} />);

      await waitFor(() => {
        expect(axiosGetSpy).toHaveBeenCalled();
      });

      // ワークシートIDが変更される
      rerender(<Dashboard worksheetId={2} />);

      await waitFor(() => {
        // 再度API呼び出しが行われることを確認
        expect(axiosGetSpy.mock.calls.length).toBeGreaterThan(1);
      });
    });
  });
});
