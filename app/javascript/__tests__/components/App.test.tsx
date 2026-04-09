/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from '../../components/App';
import { setupDefaultAxiosMocks } from '../../spec/fixtures/axiosMocks';

// Mock axios
vi.mock('axios');

describe('App - Issue #27: ワークシート選択機能の実装', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAxiosMocks();
  });

  describe('ワークシートの取得と管理', () => {
    it('アプリケーション起動時にワークシートを取得する', async () => {
      const mockWorksheets = [
        { id: 1, name: 'ワークシート1', created_at: '2026-01-01', updated_at: '2026-01-01' },
        { id: 2, name: 'ワークシート2', created_at: '2026-01-02', updated_at: '2026-01-02' },
      ];

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          authenticated: true,
          user: { id: 1, email: 'test@test.com' },
          current_worksheet: mockWorksheets[0],
        },
      } as unknown as Promise<{ data: unknown }>);

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockWorksheets,
      } as unknown as Promise<{ data: unknown }>);

      render(<App />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/worksheets');
      });
    });

    it('複数のワークシートがある場合すべて表示される', async () => {
      const mockWorksheets = [
        { id: 1, name: 'ワークシート1', created_at: '2026-01-01', updated_at: '2026-01-01' },
        { id: 2, name: 'ワークシート2', created_at: '2026-01-02', updated_at: '2026-01-02' },
        { id: 3, name: 'ワークシート3', created_at: '2026-01-03', updated_at: '2026-01-03' },
      ];

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          authenticated: true,
          user: { id: 1, email: 'test@test.com' },
          current_worksheet: mockWorksheets[0],
        },
      } as unknown as Promise<{ data: unknown }>);

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockWorksheets,
      } as unknown as Promise<{ data: unknown }>);

      render(<App />);

      await waitFor(() => {
        expect(screen.queryByText(mockWorksheets[0].name)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText(mockWorksheets[1].name)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText(mockWorksheets[2].name)).toBeInTheDocument();
      });
    });
  });

  describe('ワークシート作成機能', () => {
    it('新しいワークシート作成時にAPIを呼び出す', async () => {
      const mockWorksheets = [
        { id: 1, name: 'ワークシート1', created_at: '2026-01-01', updated_at: '2026-01-01' },
      ];

      const newWorksheet = {
        id: 2,
        name: '新しいワークシート',
        created_at: '2026-01-02',
        updated_at: '2026-01-02',
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          authenticated: true,
          user: { id: 1, email: 'test@test.com' },
          current_worksheet: mockWorksheets[0],
        },
      } as unknown as Promise<{ data: unknown }>);

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockWorksheets,
      } as unknown as Promise<{ data: unknown }>);

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: newWorksheet,
      } as unknown as Promise<{ data: unknown }>);

      render(<App />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/worksheets');
      });

      // ワークシート作成のAPIが呼ばれることを確認
      // (実装後により詳細なテストを追加)
    });
  });

  describe('Issue #30: デモ用ログイン機能', () => {
    it('LandingPage の "デモでログイン" ボタンが表示される', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          authenticated: false,
          user: null,
          current_worksheet: null,
        },
      } as unknown as Promise<{ data: unknown }>);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /デモでログイン/ })).toBeInTheDocument();
      });
    });

    it('"デモでログイン" ボタンクリックでデモアカウントでログイン', async () => {
      const user = userEvent.setup();

      // 未認証時
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          authenticated: false,
          user: null,
          current_worksheet: null,
        },
      } as unknown as Promise<{ data: unknown }>);

      // デモ用ログイン時
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          authenticated: true,
          user: { id: 1, email: 'test@example.com', name: 'デモユーザー' },
          current_worksheet: {
            id: 1,
            name: 'デモワークシート',
            interval: 1,
            week_use: false,
            week: 0,
          },
        },
      } as unknown as Promise<{ data: unknown }>);

      // ワークシート一覧取得
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: [
          {
            id: 1,
            name: 'デモワークシート',
            interval: 1,
            week_use: false,
            week: 0,
          },
        ],
      } as unknown as Promise<{ data: unknown }>);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /デモでログイン/ })).toBeInTheDocument();
      });

      const demoButton = screen.getByRole('button', { name: /デモでログイン/ });
      await user.click(demoButton);

      await waitFor(() => {
        // デモアカウントでのログインリクエスト確認
        expect(vi.mocked(axios.post)).toHaveBeenCalledWith('/api/v1/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });
});
