import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportModal from '../../components/ImportModal';
import axios from 'axios';

vi.mock('axios');

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  isAxiosError: ReturnType<typeof vi.fn>;
};

describe('ImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnImportComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('モーダルが表示される', () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <ImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="members"
        currentWorksheetId={1}
        isDemoUser={false}
      />
    );

    expect(screen.getByText('メンバーをインポート')).toBeInTheDocument();
    expect(screen.getByLabelText('インポート元ワークシート')).toBeInTheDocument();
  });

  it('ワークシートを選択するとメンバーを取得して表示する', async () => {
    const user = userEvent.setup();

    const mockWorksheets = [
      {
        id: 2,
        name: 'ワークシート2',
        user_id: 1,
        current: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    const mockMembers = [
      {
        id: 10,
        name: 'メンバーA',
        kana: 'めんばーえー',
        archive: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 11,
        name: 'メンバーB',
        kana: 'めんばーびー',
        archive: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    mockedAxios.get
      .mockResolvedValueOnce({ data: mockWorksheets })
      .mockResolvedValueOnce({ data: mockMembers });

    render(
      <ImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="members"
        currentWorksheetId={1}
        isDemoUser={false}
      />
    );

    // ワークシートが読み込まれるのを待つ
    await waitFor(() => {
      const select = screen.getByDisplayValue('選択してください');
      expect(select.querySelector('option[value="2"]')).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('選択してください');
    await user.selectOptions(select, '2');

    await waitFor(() => {
      expect(screen.getByText('メンバーA')).toBeInTheDocument();
      expect(screen.getByText('メンバーB')).toBeInTheDocument();
    });
  });

  it('メンバーをチェックして選択できる', async () => {
    const user = userEvent.setup();

    const mockWorksheets = [
      {
        id: 2,
        name: 'ワークシート2',
        user_id: 1,
        current: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    const mockMembers = [
      {
        id: 10,
        name: 'メンバーA',
        kana: 'めんばーえー',
        archive: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    mockedAxios.get
      .mockResolvedValueOnce({ data: mockWorksheets })
      .mockResolvedValueOnce({ data: mockMembers });

    render(
      <ImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="members"
        currentWorksheetId={1}
        isDemoUser={false}
      />
    );

    // ワークシートが読み込まれるのを待つ
    await waitFor(() => {
      const select = screen.getByDisplayValue('選択してください');
      expect(select.querySelector('option[value="2"]')).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('選択してください');
    await user.selectOptions(select, '2');

    await waitFor(() => {
      expect(screen.getByText('メンバーA')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(checkboxes[0]).toBeChecked();
  });

  it('インポートボタンで API にポストして現在のワークシートにインポートする', async () => {
    const user = userEvent.setup();

    const mockWorksheets = [
      {
        id: 2,
        name: 'ワークシート2',
        user_id: 1,
        current: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    const mockMembers = [
      {
        id: 10,
        name: 'メンバーA',
        kana: 'めんばーえー',
        archive: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    mockedAxios.get
      .mockResolvedValueOnce({ data: mockWorksheets })
      .mockResolvedValueOnce({ data: mockMembers });

    mockedAxios.post.mockResolvedValueOnce({ data: mockMembers });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <ImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="members"
        currentWorksheetId={1}
        isDemoUser={false}
      />
    );

    // ワークシートが読み込まれるのを待つ
    await waitFor(() => {
      const select = screen.getByDisplayValue('選択してください');
      expect(select.querySelector('option[value="2"]')).toBeInTheDocument();
    });

    // ワークシート選択
    const select = screen.getByDisplayValue('選択してください');
    await user.selectOptions(select, '2');

    await waitFor(() => {
      expect(screen.getByText('メンバーA')).toBeInTheDocument();
    });

    // チェック
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    // インポート
    const importButton = screen.getByRole('button', { name: 'インポート' });
    await user.click(importButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/members/import',
        expect.objectContaining({
          source_worksheet_id: 2,
          target_worksheet_id: 1,
          member_ids: [10],
        }),
        expect.any(Object)
      );
    });

    expect(mockOnImportComplete).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('タスクのインポートに対応する', async () => {
    const user = userEvent.setup();

    const mockWorksheets = [
      {
        id: 2,
        name: 'ワークシート2',
        user_id: 1,
        current: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    const mockWorks = [
      {
        id: 20,
        name: 'タスクA',
        multiple: false,
        archive: false,
        is_above: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    mockedAxios.get
      .mockResolvedValueOnce({ data: mockWorksheets })
      .mockResolvedValueOnce({ data: mockWorks });

    mockedAxios.post.mockResolvedValueOnce({ data: mockWorks });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <ImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="works"
        currentWorksheetId={1}
        isDemoUser={false}
      />
    );

    expect(screen.getByText('タスクをインポート')).toBeInTheDocument();

    // ワークシートが読み込まれるのを待つ
    await waitFor(() => {
      const select = screen.getByDisplayValue('選択してください');
      expect(select.querySelector('option[value="2"]')).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('選択してください');
    await user.selectOptions(select, '2');

    await waitFor(() => {
      expect(screen.getByText('タスクA')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    const importButton = screen.getByRole('button', { name: 'インポート' });
    await user.click(importButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/works/import',
        expect.objectContaining({
          source_worksheet_id: 2,
          target_worksheet_id: 1,
          work_ids: [20],
        }),
        expect.any(Object)
      );
    });

    expect(mockOnImportComplete).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('isOpen が false の場合はモーダルを表示しない', () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <ImportModal
        isOpen={false}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="members"
        currentWorksheetId={1}
        isDemoUser={false}
      />
    );

    expect(screen.queryByText('メンバーをインポート')).not.toBeInTheDocument();
  });

  it('デモユーザーはインポートできない', () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <ImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
        importType="members"
        currentWorksheetId={1}
        isDemoUser={true}
      />
    );

    const select = screen.getByDisplayValue('選択してください');
    expect(select).toBeDisabled();
  });
});
