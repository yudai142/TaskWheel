/// <reference types="vitest/globals" />
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Members from '../../../components/pages/Members';
import { mockMembersForManagement, mockWorks } from '../../../spec/fixtures/mockData';

vi.mock('axios');

describe('Members - メンバー設定モーダル', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, config?: { params?: Record<string, string> }) => {
        if (url === '/api/v1/members' && config?.params?.include_archived === 'true') {
          return Promise.resolve({ data: mockMembersForManagement });
        }
        if (url === '/api/v1/works') {
          return Promise.resolve({ data: mockWorks });
        }
        return Promise.resolve({ data: [] });
      }
    );
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (axios.patch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...mockMembersForManagement[0],
        archive: true,
      },
    });
    (axios.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  it('メンバーカードを押すと設定モーダルが開く', async () => {
    const user = userEvent.setup();

    render(<Members />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /YamadaTaro/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /YamadaTaro/ }));

    expect(screen.getByText('固定/除外設定を追加')).toBeInTheDocument();
    expect(screen.getAllByText('掃除A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('固定').length).toBeGreaterThan(0);
  });

  it('モーダル内でアーカイブを切り替えられる', async () => {
    const user = userEvent.setup();

    render(<Members />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /YamadaTaro/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /YamadaTaro/ }));
    await user.click(screen.getByRole('button', { name: 'アーカイブにする' }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/api/v1/members/1', {
        member: { archive: true },
      });
    });
  });

  it('固定/除外設定を追加できる', async () => {
    const user = userEvent.setup();

    render(<Members />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /YamadaTaro/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /YamadaTaro/ }));
    await user.selectOptions(screen.getByLabelText('当番名'), '3');
    await user.selectOptions(screen.getByLabelText('設定種別'), '1');
    await user.click(screen.getByRole('button', { name: '設定を追加' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/member_options', {
        member_option: {
          member_id: 1,
          work_id: 3,
          status: 1,
        },
      });
    });
  });

  describe('Issue #27: ワークシート連携', () => {
    it('メンバーページが選択中のワークシートIDをパラメータで受け取る', async () => {
      const { container } = render(<Members worksheetId={1} />);
      expect(container).toBeInTheDocument();
    });

    it('ワークシート変更時にメンバーデータを再取得する', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');

      const { rerender } = render(<Members worksheetId={1} />);

      await waitFor(() => {
        expect(axiosGetSpy).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
      });

      const callCountBefore = axiosGetSpy.mock.calls.length;

      rerender(<Members worksheetId={2} />);

      await waitFor(() => {
        // 再度API呼び出しが行われることを確認
        expect(axiosGetSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
      });
    });
  });
});
