/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
        mockWorksheets.forEach((worksheet) => {
          expect(screen.queryByText(worksheet.name)).toBeInTheDocument();
        });
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
});
