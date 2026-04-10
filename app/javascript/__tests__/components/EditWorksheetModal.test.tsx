import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { EditWorksheetModal } from '../../components/EditWorksheetModal';
import { setDefaultAxiosMocks } from '../spec/axiosMocks';

vi.mock('axios');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAxios = axios as any;

describe('EditWorksheetModal', () => {
  const mockWorksheet = {
    id: 1,
    name: 'Sample Worksheet',
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultAxiosMocks();
  });

  it('should render modal with worksheet name', () => {
    const mockOnClose = vi.fn();

    render(
      <EditWorksheetModal
        isOpen={true}
        worksheet={mockWorksheet}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Sample Worksheet')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    const mockOnClose = vi.fn();

    render(
      <EditWorksheetModal
        isOpen={false}
        worksheet={mockWorksheet}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByDisplayValue('Sample Worksheet')).not.toBeInTheDocument();
  });

  it('should update input value when user types', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    render(
      <EditWorksheetModal
        isOpen={true}
        worksheet={mockWorksheet}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const input = screen.getByDisplayValue('Sample Worksheet');
    await user.clear(input);
    await user.type(input, 'Updated Worksheet');

    expect(input).toHaveValue('Updated Worksheet');
  });

  it('should call onSave with updated name when save button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    mockAxios.put.mockResolvedValue({
      data: { ...mockWorksheet, name: 'Updated Worksheet' },
    });

    render(
      <EditWorksheetModal
        isOpen={true}
        worksheet={mockWorksheet}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const input = screen.getByDisplayValue('Sample Worksheet');
    await user.clear(input);
    await user.type(input, 'Updated Worksheet');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.put).toHaveBeenCalledWith(
        `/api/v1/worksheets/${mockWorksheet.id}`,
        { worksheet: { name: 'Updated Worksheet' } },
        expect.any(Object)
      );
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    render(
      <EditWorksheetModal
        isOpen={true}
        worksheet={mockWorksheet}
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

    mockAxios.put.mockRejectedValue(new Error('API Error'));

    render(
      <EditWorksheetModal
        isOpen={true}
        worksheet={mockWorksheet}
        onClose={mockOnClose}
        onSave={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('Sample Worksheet');
    await user.clear(input);
    await user.type(input, 'Updated Worksheet');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
    });
  });

  it('should close modal and call onClose after successful save', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    mockAxios.put.mockResolvedValue({
      data: { ...mockWorksheet, name: 'Updated Worksheet' },
    });

    render(
      <EditWorksheetModal
        isOpen={true}
        worksheet={mockWorksheet}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const input = screen.getByDisplayValue('Sample Worksheet');
    await user.clear(input);
    await user.type(input, 'Updated Worksheet');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ ...mockWorksheet, name: 'Updated Worksheet' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
