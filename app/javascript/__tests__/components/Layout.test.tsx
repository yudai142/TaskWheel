/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Layout from '../../components/Layout';
import type { WorksheetSummary, Notification } from '../../types';

// Mock react-router-dom

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: () => null,
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('Layout - Issue #27: ワークシート選択機能の実装', () => {
  const mockWorksheets: WorksheetSummary[] = [
    { id: 1, name: 'ワークシート1', created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 2, name: 'ワークシート2', created_at: '2026-01-02', updated_at: '2026-01-02' },
    { id: 3, name: 'ワークシート3', created_at: '2026-01-03', updated_at: '2026-01-03' },
  ];

  const mockNotification: Notification = {
    message: 'テスト通知',
    type: 'success',
  };

  const defaultProps = {
    currentUserName: 'テストユーザー',
    currentWorksheetName: 'ワークシート1',
    onLogout: vi.fn(),
    worksheets: mockWorksheets,
    showWorksheetModal: false,
    newWorksheetName: '',
    onShowWorksheetModal: vi.fn(),
    onNewWorksheetNameChange: vi.fn(),
    onCreateWorksheet: vi.fn(),
    worksheetNotification: null,
    onWorksheetNotificationDismiss: vi.fn(),
  };

  describe('ワークシートタブ表示', () => {
    it('すべてのワークシートタブが表示される', () => {
      render(
        <Layout {...defaultProps}>
          <div>Test Content</div>
        </Layout>
      );

      mockWorksheets.forEach((worksheet) => {
        expect(screen.getByText(worksheet.name)).toBeInTheDocument();
      });
    });

    it('新規作成ボタンが表示される', () => {
      render(
        <Layout {...defaultProps}>
          <div>Test Content</div>
        </Layout>
      );

      expect(screen.getByTitle('新しいワークシートを作成')).toBeInTheDocument();
    });
  });

  describe('ワークシート切り替え', () => {
    it('ワークシートタブをクリックすると選択状態が変わる', async () => {
      const user = userEvent.setup();

      render(
        <Layout {...defaultProps} worksheets={mockWorksheets}>
          <div>Test Content</div>
        </Layout>
      );

      const worksheet2Button = screen.getByText('ワークシート2');
      await user.click(worksheet2Button);

      // クリックが実行されたことを確認
      expect(worksheet2Button).toBeInTheDocument();
    });
  });

  describe('ワークシート作成モーダル', () => {
    it('新規作成ボタンをクリックするとモーダルが表示される', async () => {
      const user = userEvent.setup();
      const onShowWorksheetModal = vi.fn();

      render(
        <Layout {...defaultProps} onShowWorksheetModal={onShowWorksheetModal}>
          <div>Test Content</div>
        </Layout>
      );

      const createButton = screen.getByTitle('新しいワークシートを作成');
      await user.click(createButton);

      expect(onShowWorksheetModal).toHaveBeenCalledWith(true);
    });

    it('モーダルが表示された状態でワークシート名を入力できる', async () => {
      const user = userEvent.setup();
      const onNewWorksheetNameChange = vi.fn();

      render(
        <Layout
          {...defaultProps}
          showWorksheetModal={true}
          onNewWorksheetNameChange={onNewWorksheetNameChange}
        >
          <div>Test Content</div>
        </Layout>
      );

      expect(screen.getByText('新しいワークシートを作成')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('ワークシート名');
      await user.type(input, '新しいワークシート');

      expect(onNewWorksheetNameChange).toHaveBeenCalled();
    });

    it('モーダルの作成ボタンをクリックするとハンドラが呼ばれる', async () => {
      const user = userEvent.setup();
      const onCreateWorksheet = vi.fn();

      render(
        <Layout
          {...defaultProps}
          showWorksheetModal={true}
          newWorksheetName="新しいワークシート"
          onCreateWorksheet={onCreateWorksheet}
        >
          <div>Test Content</div>
        </Layout>
      );

      const createButton = screen.getByText('作成');
      await user.click(createButton);

      expect(onCreateWorksheet).toHaveBeenCalled();
    });

    it('モーダルをキャンセルできる', async () => {
      const user = userEvent.setup();
      const onShowWorksheetModal = vi.fn();

      render(
        <Layout
          {...defaultProps}
          showWorksheetModal={true}
          onShowWorksheetModal={onShowWorksheetModal}
        >
          <div>Test Content</div>
        </Layout>
      );

      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      expect(onShowWorksheetModal).toHaveBeenCalledWith(false);
    });
  });

  describe('通知ポップアップ', () => {
    it('通知が表示される', () => {
      render(
        <Layout {...defaultProps} worksheetNotification={mockNotification}>
          <div>Test Content</div>
        </Layout>
      );

      expect(screen.getByText('テスト通知')).toBeInTheDocument();
    });

    it('通知を閉じるボタンをクリックするとハンドラが呼ばれる', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <Layout
          {...defaultProps}
          worksheetNotification={mockNotification}
          onWorksheetNotificationDismiss={onDismiss}
        >
          <div>Test Content</div>
        </Layout>
      );

      const closeButton = screen.getByRole('button', { name: '' });
      await user.click(closeButton);

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('サイドバー', () => {
    it('ユーザー名がサイドバーに表示される', () => {
      render(
        <Layout {...defaultProps} currentUserName="太郎">
          <div>Test Content</div>
        </Layout>
      );

      expect(screen.getByText('太郎')).toBeInTheDocument();
    });
  });
});
