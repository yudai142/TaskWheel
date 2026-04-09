/// <reference types="vitest/globals" />
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from '../../../components/auth/LandingPage';

describe('LandingPage', () => {
  it('新規登録ボタンとログインボタンが表示される', () => {
    render(<LandingPage onOpenLogin={vi.fn()} onOpenRegister={vi.fn()} />);

    expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Googleでログイン' })).toBeInTheDocument();
  });

  it('GoogleログインはPOSTフォームで送信される', () => {
    render(<LandingPage onOpenLogin={vi.fn()} onOpenRegister={vi.fn()} />);

    const googleButton = screen.getByRole('button', { name: 'Googleでログイン' });
    const form = googleButton.closest('form');

    expect(form).not.toBeNull();
    expect(form).toHaveAttribute('action', '/users/auth/google_oauth2');
    expect(form).toHaveAttribute('method', 'post');
  });

  it('新規登録ボタン押下時にハンドラーが呼ばれる', async () => {
    const user = userEvent.setup();
    const onOpenRegister = vi.fn();

    render(<LandingPage onOpenLogin={vi.fn()} onOpenRegister={onOpenRegister} />);
    await user.click(screen.getByRole('button', { name: '新規登録' }));

    expect(onOpenRegister).toHaveBeenCalledTimes(1);
  });

  it('ログインボタン押下時にハンドラーが呼ばれる', async () => {
    const user = userEvent.setup();
    const onOpenLogin = vi.fn();

    render(<LandingPage onOpenLogin={onOpenLogin} onOpenRegister={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(onOpenLogin).toHaveBeenCalledTimes(1);
  });

  describe('Issue #30: デモログイン機能', () => {
    it('"デモでログイン"ボタンが表示される', () => {
      const onDemoLogin = vi.fn();
      render(
        <LandingPage onOpenLogin={vi.fn()} onOpenRegister={vi.fn()} onDemoLogin={onDemoLogin} />
      );

      const demoButton = screen.getByRole('button', { name: /デモでログイン/ });
      expect(demoButton).toBeInTheDocument();
    });

    it('"デモでログイン"ボタンクリックで onDemoLogin が呼ばれる', async () => {
      const user = userEvent.setup();
      const onDemoLogin = vi.fn();
      render(
        <LandingPage onOpenLogin={vi.fn()} onOpenRegister={vi.fn()} onDemoLogin={onDemoLogin} />
      );

      const demoButton = screen.getByRole('button', { name: /デモでログイン/ });
      await user.click(demoButton);

      expect(onDemoLogin).toHaveBeenCalledTimes(1);
    });
  });
});
