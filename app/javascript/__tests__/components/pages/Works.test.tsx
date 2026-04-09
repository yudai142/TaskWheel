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
      (url: string, config?: { params?: Record<string, unknown> }) => {
        if (url === '/api/v1/works') {
          expect(config?.params?.worksheet_id).toBeDefined();
          return Promise.resolve({ data: mockWorks });
        }
        if (url === '/api/v1/members') {
          expect(config?.params?.worksheet_id).toBeDefined();
          return Promise.resolve({ data: mockMembers });
        }
        return Promise.resolve({ data: [] });
      }
    );
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (axios.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('ワークシートIDパラメータの受け取りと反映', () => {
    it('worksheetIdをpropsで受け取ると、各APIに反映される', async () => {
      render(<Works worksheetId={123} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', {
          params: { worksheet_id: 123 },
        });
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', {
          params: { worksheet_id: 123 },
        });
      });
    });

    it('worksheetIdがnullの場合、APIに反映される', async () => {
      render(<Works worksheetId={null} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', {
          params: { worksheet_id: null },
        });
      });
    });

    it('worksheetIdが変更されると、データが再取得される', async () => {
      const { rerender } = render(<Works worksheetId={1} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', {
          params: { worksheet_id: 1 },
        });
      });

      vi.clearAllMocks();

      rerender(<Works worksheetId={2} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', {
          params: { worksheet_id: 2 },
        });
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

    it('読み込み中状態が表示される', () => {
      render(<Works worksheetId={1} />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('当番作成機能', () => {
    it('新規追加ボタンで当番作成フォームが表示される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText('新規追加')).toBeInTheDocument();
      });

      await user.click(screen.getByText('新規追加'));

      // 当番名ラベルを探して、その次のinputを取得
      const labels = screen.getAllByText('当番名');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('当番を作成すると、データが再取得される', async () => {
      const user = userEvent.setup();
      render(<Works worksheetId={1} />);

      await waitFor(() => {
        expect(screen.getByText('新規追加')).toBeInTheDocument();
      });

      await user.click(screen.getByText('新規追加'));

      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      const nameInput = inputs[0];
      await user.type(nameInput, 'テスト当番');

      const submitButton = screen.getByRole('button', { name: /追加/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
      });
    });
  });

  describe('当番削除機能', () => {
    it('削除ボタンで当番が削除される', async () => {
      const user = userEvent.setup();

      window.confirm = vi.fn().mockReturnValue(true);

      render(<Works worksheetId={1} />);

      await waitFor(() => {
        mockWorks.forEach((work) => {
          expect(screen.getByText(work.name)).toBeInTheDocument();
        });
      });

      const deleteButton = screen.getAllByRole('button', { name: /削除/ })[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalled();
      });
    });
  });
});
