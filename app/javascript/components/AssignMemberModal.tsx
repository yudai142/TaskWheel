import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Member, Work } from '../../types';

interface AssignMemberModalProps {
  isOpen: boolean;
  member: Member;
  works: Work[];
  worksheetId: number;
  currentWorkId: number | null;
  onClose: () => void;
  onSave: () => void;
}

export function AssignMemberModal({
  isOpen,
  member,
  works,
  worksheetId,
  currentWorkId,
  onClose,
  onSave,
}: AssignMemberModalProps): JSX.Element | null {
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(currentWorkId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setSelectedWorkId(currentWorkId);
    setError(null);
  }, [currentWorkId, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async (): Promise<void> => {
    if (selectedWorkId === null) {
      setError('タスクを選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post(
        `/api/v1/worksheets/${worksheetId}/assign_member`,
        { member_id: member.id, work_id: selectedWorkId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      onSave();
      onClose();
    } catch (err) {
      const error = err as {
        response?: { data?: { error?: string; errors?: string[] } };
      };
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.errors?.join(', ') ||
        'メンバー割り当ての変更に失敗しました';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">割り当て先を変更</h3>
          <button
            onClick={onClose}
            aria-label="モーダルを閉じる"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-primary-50 border border-primary-300 rounded-lg">
          <p className="text-sm text-primary-700 font-medium">{member.name}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700">エラーが発生しました</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <select
            value={selectedWorkId ?? ''}
            onChange={(e) =>
              setSelectedWorkId(e.target.value ? parseInt(e.target.value, 10) : null)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={isLoading}
          >
            <option value="">-- タスクを選択 --</option>
            {works
              .filter((work) => work.is_above)
              .map((work) => (
                <option key={work.id} value={work.id}>
                  {work.name}
                </option>
              ))}
          </select>
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
