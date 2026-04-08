/// <reference types="vitest/globals" />
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import PasswordResetPage from '../../../components/auth/PasswordResetPage';

vi.mock('axios');

describe('PasswordResetPage', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/password-reset?token=test-token');
    vi.clearAllMocks();
  });

  it('新しいパスワードを送信して再設定APIを呼び出す', async () => {
    const user = userEvent.setup();
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/v1/auth/password/validate_token') {
        return Promise.resolve({ data: { success: true } });
      }
      if (url === '/api/v1/auth/password/reset') {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<PasswordResetPage />);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/password/validate_token', {
        token: 'test-token',
      });
    });

    await user.type(screen.getByLabelText('新しいパスワード'), 'newpassword123');
    await user.type(screen.getByLabelText('新しいパスワード（確認）'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'パスワードを再設定' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/password/reset', {
        token: 'test-token',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      });
    });
  });

  it('無効トークン時はフォームを表示せずエラーメッセージのみ表示する', async () => {
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: {
        data: {
          message: '再設定トークンが古いため無効です。再度メールを送信してください。',
        },
      },
      isAxiosError: true,
    });

    render(<PasswordResetPage />);

    await waitFor(() => {
      expect(
        screen.getByText('再設定トークンが古いため無効です。再度メールを送信してください。')
      ).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('新しいパスワード')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'パスワードを再設定' })).not.toBeInTheDocument();
  });
});
