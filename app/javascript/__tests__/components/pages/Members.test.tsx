/// <reference types="vitest/globals" />
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Members from '../../../components/pages/Members';
import { mockMembersForManagement, mockWorks } from '../../../spec/fixtures/mockData';

vi.mock('axios');

describe('Members - メンバー管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, _config?: { params?: Record<string, unknown> }) => {
        if (url === '/api/v1/members') {
          return Promise.resolve({ data: mockMembersForManagement });
        }
        if (url === '/api/v1/works') {
          return Promise.resolve({ data: mockWorks });
        }
        return Promise.resolve({ data: [] });
      }
    );
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (axios.patch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, data: unknown) => {
        if (url.includes('/api/v1/members/')) {
          const id = parseInt(url.split('/').pop() || '', 10);
          const memberToUpdate = mockMembersForManagement.find((m) => m.id === id);
          if (
            memberToUpdate &&
            typeof data === 'object' &&
            data !== null &&
            'member' in data &&
            typeof (data as Record<string, unknown>).member === 'object' &&
            (data as Record<string, unknown>).member !== null
          ) {
            const memberUpdate = (data as Record<string, unknown>).member as Record<
              string,
              unknown
            >;
            const updatedMember = { ...memberToUpdate, ...memberUpdate };
            return Promise.resolve({ data: updatedMember });
          }
          return Promise.resolve({ data: memberToUpdate || {} });
        }
        return Promise.resolve({ data: {} });
      }
    );
    (axios.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  describe('メンバー一覧表示', () => {
    it('メンバーカードが一覧表示される', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        mockMembersForManagement.forEach((member) => {
          expect(screen.getByRole('button', { name: new RegExp(member.name) })).toBeInTheDocument();
        });
      });
    });
  });

  describe('メンバー編集機能', () => {
    it('メンバーカードをクリックすると編集フォーム＆固定/除外設定パネルが表示される', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      // メンバーが表示されるまで待機
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
        ).toBeInTheDocument();
      });

      // メンバーカードをクリック
      await user.click(
        screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
      );

      // 左側：編集フォームが表示される
      expect(screen.getByText('メンバーを編集')).toBeInTheDocument();
      expect(screen.getByLabelText('名前')).toBeInTheDocument();
      expect(screen.getByLabelText('かな')).toBeInTheDocument();
      expect(screen.getByLabelText('アーカイブにする')).toBeInTheDocument();

      // 右側：固定/除外設定パネルが表示される
      expect(screen.getByText('固定/除外設定を追加')).toBeInTheDocument();
      expect(screen.getByLabelText('タスク名')).toBeInTheDocument();
      expect(screen.getByLabelText('設定種別')).toBeInTheDocument();
    });

    it('編集フォームでメンバーを保存できる', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      // メンバーが表示されるまで待機
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
        ).toBeInTheDocument();
      });

      // メンバーカードをクリック
      await user.click(
        screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
      );

      // 名前を変更
      const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, '新しい名前');

      // 保存ボタンをクリック
      const saveButtons = screen.getAllByRole('button', { name: '保存' });
      await user.click(saveButtons[0]);

      // API呼び出しを確認
      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          `/api/v1/members/${mockMembersForManagement[0].id}`,
          expect.objectContaining({
            member: expect.objectContaining({
              name: '新しい名前',
            }),
          })
        );
      });
    });

    it('アーカイブを切り替えして保存できる', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      // メンバーが表示されるまで待機
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
        ).toBeInTheDocument();
      });

      // メンバーカードをクリック
      await user.click(
        screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
      );

      // アーカイブチェックボックスをチェック
      const archiveCheckbox = screen.getByLabelText('アーカイブにする');
      await user.click(archiveCheckbox);

      // 保存ボタンをクリック
      const saveButtons = screen.getAllByRole('button', { name: '保存' });
      await user.click(saveButtons[0]);

      // API呼び出しを確認
      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          `/api/v1/members/${mockMembersForManagement[0].id}`,
          expect.objectContaining({
            member: expect.objectContaining({
              archive: true,
            }),
          })
        );
      });
    });

    it('固定/除外設定を追加できる', async () => {
      const user = userEvent.setup();
      render(<Members worksheetId={null} />);

      // メンバーが表示されるまで待機
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
        ).toBeInTheDocument();
      });

      // メンバーカードをクリック
      await user.click(
        screen.getByRole('button', { name: new RegExp(mockMembersForManagement[0].name) })
      );

      // 固定/除外設定パネルでタスク名とステータスを選択
      const workSelect = screen.getByLabelText('タスク名');
      await user.selectOptions(workSelect, mockWorks[0].id.toString());

      const statusSelect = screen.getByLabelText('設定種別');
      await user.selectOptions(statusSelect, '1');

      // 設定を追加ボタンを押す
      await user.click(screen.getByRole('button', { name: '設定を追加' }));

      // API呼び出しを確認
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/member_options', {
          member_option: {
            member_id: mockMembersForManagement[0].id,
            work_id: mockWorks[0].id,
            status: 1,
          },
        });
      });
    });
  });

  describe('Issue #27: ワークシート連携', () => {
    it('メンバーページが選択中のワークシートIDをパラメータで受け取る', async () => {
      const { container } = render(<Members worksheetId={1} />);
      expect(container).toBeInTheDocument();
    });

    it('worksheetIdがnullの場合、各APIが呼び出される', async () => {
      render(<Members worksheetId={null} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
      });
    });

    it('worksheetIdが変更されると、データが再取得される', async () => {
      const { rerender } = render(<Members worksheetId={1} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
      });

      vi.clearAllMocks();
      (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (url: string, _config?: { params?: Record<string, unknown> }) => {
          if (url === '/api/v1/members') {
            return Promise.resolve({ data: mockMembersForManagement });
          }
          if (url === '/api/v1/works') {
            return Promise.resolve({ data: mockWorks });
          }
          return Promise.resolve({ data: [] });
        }
      );

      rerender(<Members worksheetId={2} />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/members', expect.any(Object));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/works', expect.any(Object));
      });
    });
  });
});
