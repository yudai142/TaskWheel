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

    render(<Members worksheetId={null} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Yamada Taro/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Yamada Taro/ }));

    // 2列レイアウト内で設定パネルが表示されることを確認
    expect(screen.getByText('メンバーを編集')).toBeInTheDocument();
    expect(screen.getByText('メンバー固定/除外設定を追加')).toBeInTheDocument();
    expect(screen.getByLabelText('メンバー名')).toBeInTheDocument();
    expect(screen.getByLabelText('設定種別')).toBeInTheDocument();
  });

  it('モーダル内でアーカイブを切り替えられる', async () => {
    const user = userEvent.setup();

    render(<Members worksheetId={null} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Yamada Taro/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Yamada Taro/ }));

    // 編集ボタン（複数ある場合は最初のもの）をクリック
    const editButtons = screen.getAllByRole('button', { name: '編集' });
    await user.click(editButtons[0]);

    // アーカイブチェックボックスをチェック
    const archiveCheckbox = screen.getByLabelText('アーカイブにする');
    await user.click(archiveCheckbox);

    // 保存ボタンをクリック
    const saveButtons = screen.getAllByRole('button', { name: '保存' });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/api/v1/members/1', {
        member: { archive: true, name: 'Yamada Taro', kana: 'ヤマダ タロウ' },
      });
    });
  });

  it('固定/除外設定を追加できる', async () => {
    const user = userEvent.setup();

    render(<Members worksheetId={null} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Yamada Taro/ })).toBeInTheDocument();
    });

    // メンバーカードをクリックして詳細ビューを開く
    await user.click(screen.getByRole('button', { name: /Yamada Taro/ }));

    // モーダル内で設定パネルの当番名セレクトを選択
    const workSelect = screen.getByLabelText('当番名');
    await user.selectOptions(workSelect, '3');

    // 設定種別を選択
    const statusSelect = screen.getByLabelText('設定種別');
    await user.selectOptions(statusSelect, '1');

    // 設定を追加ボタンを押す
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
