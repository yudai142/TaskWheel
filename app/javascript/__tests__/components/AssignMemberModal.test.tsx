import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { AssignMemberModal } from '../../components/AssignMemberModal';
import { setDefaultAxiosMocks } from '../fixtures/axiosMocks';
import type { Member, Work } from '../../types';

vi.mock('axios');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAxios = axios as any;

describe('AssignMemberModal', () => {
  const mockMember: Member = {
    id: 1,
    name: 'John Doe',
    kana: 'ジョンドウ',
    archive: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockWorks: Work[] = [
    {
      id: 1,
      name: 'Work A',
      multiple: 0,
      archive: false,
      is_above: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Work B',
      multiple: 0,
      archive: false,
      is_above: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultAxiosMocks();
  });

  it('should render modal with member name', () => {
    const mockOnClose = vi.fn();

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    const mockOnClose = vi.fn();

    render(
      <AssignMemberModal
        isOpen={false}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should render work options in select dropdown', () => {
    const mockOnClose = vi.fn();

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Work A')).toBeInTheDocument();
    expect(screen.getByText('Work B')).toBeInTheDocument();
  });

  it('should update selected work when dropdown selection changes', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Work B');

    expect(select).toHaveValue('2');
  });

  it('should call onSave with member and selected work when save button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    mockAxios.post.mockResolvedValue({
      data: { member_id: 1, work_id: 2 },
    });

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Work B');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        `/api/v1/worksheets/1/assign_member`,
        { member_id: mockMember.id, work_id: 2 },
        expect.any(Object)
      );
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display error message when API call fails', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    mockAxios.post.mockRejectedValue(new Error('API Error'));

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Work B');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
    });
  });

  it('should close modal and call onSave after successful assignment', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    mockAxios.post.mockResolvedValue({
      data: { member_id: 1, work_id: 2 },
    });

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'Work B');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle unassigned member (currentWorkId = null)', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    mockAxios.post.mockResolvedValue({
      data: { member_id: 1, work_id: 1 },
    });

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={null}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // セレクトで未選択状態でタスクを選択
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('');

    await user.selectOptions(select, 'Work A');
    expect(select).toHaveValue('1');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        `/api/v1/worksheets/1/assign_member`,
        { member_id: mockMember.id, work_id: 1 },
        expect.any(Object)
      );
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should change assignment for already assigned member', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    mockAxios.post.mockResolvedValue({
      data: { member_id: 1, work_id: 2 },
    });

    render(
      <AssignMemberModal
        isOpen={true}
        member={mockMember}
        works={mockWorks}
        worksheetId={1}
        currentWorkId={1}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // 初期状態は Work A が選択されている
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('1');

    // Work B に変更
    await user.selectOptions(select, 'Work B');
    expect(select).toHaveValue('2');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        `/api/v1/worksheets/1/assign_member`,
        { member_id: mockMember.id, work_id: 2 },
        expect.any(Object)
      );
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});
