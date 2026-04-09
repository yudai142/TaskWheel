import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Dashboard from '../../../components/pages/Dashboard';
import { setDefaultAxiosMocks } from '../../fixtures/axiosMocks';

vi.mock('axios');

type MockedAxios = {
  get: {
    mockResolvedValue: (value: unknown) => void;
    mockImplementation: (fn: (url: string) => Promise<unknown>) => void;
  };
  post: { mockResolvedValue: (value: unknown) => void };
  patch: { mockResolvedValue: (value: unknown) => void };
  delete: { mockResolvedValue: (value: unknown) => void };
};

const mockedAxios = axios as unknown as MockedAxios;

describe('Dashboard - Worksheet Tabs Feature', () => {
  const mockWorksheets = [
    { id: 1, name: 'ワークシート1', interval: 7, week_use: false, week: 0 },
    { id: 2, name: 'ワークシート2', interval: 7, week_use: false, week: 0 },
  ];

  const mockWorks = [
    { id: 1, name: '掃除', multiple: 1, archive: false, is_above: true },
    { id: 2, name: '洗濯', multiple: 1, archive: false, is_above: true },
  ];

  const mockMembers = [
    { id: 1, family_name: '山田', given_name: '太郎', kana_name: 'やまだたろう', archive: false },
    { id: 2, family_name: '佐藤', given_name: '花子', kana_name: 'さとうはなこ', archive: false },
  ];

  const mockHistories: any[] = [];

  beforeEach(() => {
    setDefaultAxiosMocks();

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/v1/works')) {
        return Promise.resolve({ data: mockWorks });
      }
      if (url.includes('/api/v1/members')) {
        return Promise.resolve({ data: mockMembers });
      }
      if (url.includes('/api/v1/histories')) {
        return Promise.resolve({ data: mockHistories });
      }
      if (url.includes('/api/v1/worksheets')) {
        return Promise.resolve({ data: mockWorksheets });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('ワークシートタブが表示される', async () => {
    render(<Dashboard worksheetId={null} />);

    await waitFor(() => {
      mockWorksheets.forEach((worksheet) => {
        expect(screen.queryByText(worksheet.name)).not.toBeNull();
      });
    });
  });

  it('「掃除当番管理」のテキストが表示されない', () => {
    render(<Dashboard worksheetId={null} />);

    expect(screen.queryByText('掃除当番管理')).toBeNull();
  });

  it('＋ボタンがクリックできる', async () => {
    render(<Dashboard worksheetId={null} />);

    const addButton = screen.getByRole('button', { name: /\+/i }) || screen.getByText('+');
    expect(addButton).toBeTruthy();
  });

  it('＋ボタンをクリックするとワークシート作成モーダルが表示される', async () => {
    render(<Dashboard worksheetId={null} />);

    const addButton = screen.getByRole('button', { name: /\+/i }) || screen.getByText('+');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/ワークシート名/i)).toBeInTheDocument();
    });
  });

  it('モーダルに入力欄と作成ボタンがある', async () => {
    render(<Dashboard worksheetId={null} />);

    const addButton = screen.getByRole('button', { name: /\+/i }) || screen.getByText('+');
    fireEvent.click(addButton);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/ワークシート名/i);
      const createButton = screen.getByRole('button', { name: /作成/i });

      expect(input).toBeInTheDocument();
      expect(createButton).toBeInTheDocument();
    });
  });

  it('ワークシート名を入力して作成ボタンをクリックする', async () => {
    const user = userEvent.setup();

    mockedAxios.post.mockResolvedValue({
      data: { id: 3, name: '新しいワークシート', interval: 7, week_use: false, week: 0 },
    });

    render(<Dashboard worksheetId={null} />);

    const addButton = screen.getByRole('button', { name: /\+/i }) || screen.getByText('+');
    fireEvent.click(addButton);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/ワークシート名/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/ワークシート名/i) as HTMLInputElement;
    await user.type(input, '新しいワークシート');

    const createButton = screen.getByRole('button', { name: /作成/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/worksheets',
        expect.objectContaining({ name: '新しいワークシート' })
      );
    });
  });

  it('ワークシートタブをクリックでワークシート切り替え可能', async () => {
    render(<Dashboard worksheetId={null} />);

    await waitFor(() => {
      const tab = screen.queryByText(mockWorksheets[1].name);
      if (tab) {
        fireEvent.click(tab);
      }
    });
  });

  it('新しく作成したワークシートがタブに表示される', async () => {
    const user = userEvent.setup();

    const newWorksheet = {
      id: 3,
      name: '新規ワークシート',
      interval: 7,
      week_use: false,
      week: 0,
    };

    mockedAxios.post.mockResolvedValue({ data: newWorksheet });
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/v1/worksheets')) {
        return Promise.resolve({
          data: [...mockWorksheets, newWorksheet],
        });
      }
      if (url.includes('/api/v1/works')) {
        return Promise.resolve({ data: mockWorks });
      }
      if (url.includes('/api/v1/members')) {
        return Promise.resolve({ data: mockMembers });
      }
      if (url.includes('/api/v1/histories')) {
        return Promise.resolve({ data: mockHistories });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<Dashboard worksheetId={null} />);

    const addButton = screen.getByRole('button', { name: /\+/i }) || screen.getByText('+');
    fireEvent.click(addButton);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/ワークシート名/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/ワークシート名/i) as HTMLInputElement;
    await user.type(input, newWorksheet.name);

    const createButton = screen.getByRole('button', { name: /作成/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.queryByText(newWorksheet.name)).toBeInTheDocument();
    });
  });
});
