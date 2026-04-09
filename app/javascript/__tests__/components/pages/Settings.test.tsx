/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Settings from '../../../components/pages/Settings';

vi.mock('axios');

describe('Settings - Issue #27: ワークシート選択機能のワークシート連携', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('ワークシートIDの受け取り', () => {
    it('worksheetIdをpropsで受け取ることができる', () => {
      render(<Settings worksheetId={123} />);

      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('worksheetIdがnullの場合でも正常にレンダリングされる', () => {
      render(<Settings worksheetId={null} />);

      expect(screen.getByText('設定')).toBeInTheDocument();
    });
  });

  describe('シャッフル設定', () => {
    it('シャッフル設定セクションが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByText('シャッフル設定')).toBeInTheDocument();
    });

    it('リセット日付入力フィールドが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByLabelText(/リセット日付/)).toBeInTheDocument();
    });

    it('リセット日付を変更するとAPIが呼び出される', async () => {
      const user = userEvent.setup();
      window.alert = vi.fn();

      render(<Settings worksheetId={1} />);

      const dateInput = screen.getByLabelText(/リセット日付/) as HTMLInputElement;
      await user.type(dateInput, '2026-04-09');

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/shuffle_options', expect.any(Object));
      });
    });

    it('週間モードトグルが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByLabelText(/週間モード/)).toBeInTheDocument();
    });

    it('週間モードトグルで状態が変わる', async () => {
      const user = userEvent.setup();
      window.alert = vi.fn();

      render(<Settings worksheetId={1} />);

      const weekModeCheckbox = screen.getByLabelText(/週間モード/) as HTMLInputElement;
      expect(weekModeCheckbox.checked).toBe(false);

      await user.click(weekModeCheckbox);

      expect(weekModeCheckbox.checked).toBe(true);
    });
  });

  describe('バックアップセクション', () => {
    it('バックアップセクションが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByText('バックアップ')).toBeInTheDocument();
    });

    it('データエクスポートボタンが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByRole('button', { name: /データをエクスポート/ })).toBeInTheDocument();
    });
  });

  describe('危険なアクション', () => {
    it('危険なアクションセクションが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByText('危険なアクション')).toBeInTheDocument();
    });

    it('すべてのデータを削除ボタンが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByRole('button', { name: /すべてのデータを削除/ })).toBeInTheDocument();
    });

    it('警告メッセージが表示される', () => {
      render(<Settings worksheetId={1} />);

      expect(screen.getByText(/この操作はやり直せません/)).toBeInTheDocument();
    });
  });
});
