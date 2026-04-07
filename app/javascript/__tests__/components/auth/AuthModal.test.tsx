/// <reference types="vitest/globals" />
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../../../components/auth/AuthModal';

describe('AuthModal', () => {
  it('ログインモードでonLoginが呼ばれる', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthModal
        mode="login"
        onClose={vi.fn()}
        onLogin={onLogin}
        onRegister={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('新規登録モードでonRegisterが呼ばれる', async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthModal
        mode="register"
        onClose={vi.fn()}
        onLogin={vi.fn().mockResolvedValue(undefined)}
        onRegister={onRegister}
      />
    );

    await user.type(screen.getByLabelText('名前'), 'テストユーザー');
    await user.type(screen.getByLabelText('メールアドレス'), 'new@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
    await user.click(screen.getByRole('button', { name: '新規登録' }));

    await waitFor(() => {
      expect(onRegister).toHaveBeenCalledWith(
        'テストユーザー',
        'new@example.com',
        'password123',
        'password123'
      );
    });
  });
});
