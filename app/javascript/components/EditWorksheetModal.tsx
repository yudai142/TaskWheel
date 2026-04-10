import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { WorksheetSummary } from '../types';

interface EditWorksheetModalProps {
  isOpen: boolean;
  worksheet: WorksheetSummary;
  onClose: () => void;
  onSave: (worksheet: WorksheetSummary) => void;
}

export function EditWorksheetModal({
  isOpen,
  worksheet,
  onClose,
  onSave,
}: EditWorksheetModalProps): JSX.Element | null {
  const [worksheetName, setWorksheetName] = useState<string>(worksheet.name || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setWorksheetName(worksheet.name || '');
    setError(null);
  }, [worksheet, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async (): Promise<void> => {
    if (!worksheetName.trim()) {
      setError('ワークシート名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put<WorksheetSummary>(
        `/api/v1/worksheets/${worksheet.id}`,
        { worksheet: { name: worksheetName.trim() } },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      onSave(response.data);
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      const errorMsg =
        error.response?.data?.errors?.join(', ') || 'ワークシート名の更新に失敗しました';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">ワークシート名を編集</h3>
          <button
            onClick={onClose}
            aria-label="モーダルを閉じる"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            value={worksheetName}
            onChange={(e) => setWorksheetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                void handleSave();
              }
            }}
            placeholder="ワークシート名"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            autoFocus
            disabled={isLoading}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              onClick={() => void handleSave()}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
