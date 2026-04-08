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
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true },
    });

    render(<PasswordResetPage />);

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
});
