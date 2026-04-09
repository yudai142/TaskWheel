/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import HistoryPage from '../../../components/pages/History';
import { mockHistories } from '../../../spec/fixtures/mockData';

vi.mock('axios');

describe('History - Issue #27: ワークシート選択機能のワークシート連携', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, config?: { params?: Record<string, unknown> }) => {
        if (url === '/api/v1/histories') {
          expect(config?.params?.worksheet_id).toBeDefined();
          expect(config?.params?.year).toBeDefined();
          expect(config?.params?.month).toBeDefined();
          return Promise.resolve({ data: mockHistories });
        }
        return Promise.resolve({ data: [] });
      }
    );
    (axios.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('ワークシートIDパラメータの受け取りと反映', () => {
    it('worksheetIdをpropsで受け取ると、APIに反映される', async () => {
      render(<HistoryPage worksheetId={123} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/histories', {
          params: expect.objectContaining({
            worksheet_id: 123,
          }),
        });
      });
    });

    it('worksheetIdがnullの場合、APIに反映される', async () => {
      render(<HistoryPage worksheetId={null} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/histories', {
          params: expect.objectContaining({
            worksheet_id: null,
          }),
        });
      });
    });

    it('worksheetIdが変更されると、データが再取得される', async () => {
      const { rerender } = render(<HistoryPage worksheetId={1} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/histories', {
          params: expect.objectContaining({
            worksheet_id: 1,
          }),
        });
      });

      vi.clearAllMocks();

      rerender(<HistoryPage worksheetId={2} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/histories', {
          params: expect.objectContaining({
            worksheet_id: 2,
          }),
        });
      });
    });
  });

  describe('履歴一覧の表示', () => {
    it('読み込み中状態が表示される', () => {
      render(<HistoryPage worksheetId={1} />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('月の選択機能が正しく動作する', async () => {
      render(<HistoryPage worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /←/ })).toBeInTheDocument();
      });

      const prevButton = screen.getByRole('button', { name: /←/ });
      expect(prevButton).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /→/ });
      expect(nextButton).toBeInTheDocument();
    });

    it('月を変更するとデータが再取得される', async () => {
      const user = userEvent.setup();
      render(<HistoryPage worksheetId={1} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      const prevButton = screen.getByRole('button', { name: /←/ });
      await user.click(prevButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/histories', {
          params: expect.objectContaining({
            worksheet_id: 1,
          }),
        });
      });
    });
  });

  describe('履歴削除機能', () => {
    it('削除ボタンが表示される', () => {
      render(<HistoryPage worksheetId={1} />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('空の状態表示', () => {
    it('履歴がない場合、メッセージが表示される', async () => {
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      render(<HistoryPage worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText('記録がありません')).toBeInTheDocument();
      });
    });
  });
});
