import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Work } from '../../types';

interface BulkFormData {
  text: string;
}

interface EditFormData {
  name: string;
  multiple: number;
  is_above: boolean;
  archive: boolean;
}

interface Props {
  worksheetId: number | null;
  isDemoUser?: boolean;
}

export default function Works({ worksheetId, isDemoUser = false }: Props): JSX.Element {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showBulkForm, setShowBulkForm] = useState<boolean>(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [filter, setFilter] = useState<'active' | 'all' | 'archived'>('active');
  const [bulkFormData, setBulkFormData] = useState<BulkFormData>({ text: '' });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    multiple: 1,
    is_above: false,
    archive: false,
  });

  useEffect(() => {
    void fetchWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId, filter]);

  const fetchWorks = async (): Promise<void> => {
    try {
      const response = await axios.get<Work[]>('/api/v1/works', {
        params: { filter },
      });
      setWorks(response.data);
    } catch {
      // Error fetching works
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!worksheetId) return;

    try {
      const lines = bulkFormData.text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          return {
            name: parts[0] || '',
            multiple: parts[1] ? parseInt(parts[1], 10) : 1,
            is_above: parts[2] === '以上' || (parts[2] ?? '') === 'true',
          };
        })
        .filter((work) => work.name);

      if (lines.length === 0) {
        alert('有効な当番を入力してください');
        return;
      }

      await axios.post('/api/v1/works/bulk_create', {
        works: lines,
        worksheet_id: worksheetId,
      });

      setBulkFormData({ text: '' });
      setShowBulkForm(false);
      await fetchWorks();
    } catch {
      alert('当番の一括追加に失敗しました');
    }
  };

  const handleOpenEditModal = (work: Work): void => {
    setSelectedWork(work);
    setEditFormData({
      name: work.name,
      multiple: work.multiple ?? 1,
      is_above: work.is_above ?? true,
      archive: work.archive,
    });
    setEditMode(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedWork) return;

    try {
      const response = await axios.patch<Work>(`/api/v1/works/${selectedWork.id}`, {
        work: editFormData,
      });

      setWorks((currentWorks) =>
        currentWorks.map((work) => (work.id === response.data.id ? response.data : work))
      );
      setSelectedWork(null);
      setEditMode(false);
    } catch {
      alert('当番の更新に失敗しました');
    }
  };

  if (loading) return <div className="text-center py-12">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">当番管理</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'active' | 'all' | 'archived')}
            className="input-field py-2"
          >
            <option value="active">有効な当番</option>
            <option value="all">すべて</option>
            <option value="archived">アーカイブ</option>
          </select>
          <button
            onClick={() => setShowBulkForm(!showBulkForm)}
            className="btn-primary"
            disabled={isDemoUser}
            title={isDemoUser ? 'デモアカウントでは本機能は使用できません' : ''}
          >
            {showBulkForm ? 'キャンセル' : '一括追加'}
          </button>
        </div>
      </div>

      {showBulkForm && (
        <div className="card">
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label htmlFor="bulk-works" className="block text-sm font-medium text-gray-700">
                当番を一括登録
              </label>
              <p className="text-xs text-gray-500 mb-2">
                1行に1当番「名前 複数数 (オプション)」の形式で入力してください
              </p>
              <textarea
                id="bulk-works"
                className="input-field min-h-[120px] font-mono text-sm"
                value={bulkFormData.text}
                onChange={(e) => setBulkFormData({ text: e.target.value })}
                placeholder="例:&#10;掃除 2 以上&#10;ゴミ捨て 1"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              一括追加
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <button
            key={work.id}
            type="button"
            onClick={() => handleOpenEditModal(work)}
            className="card text-left transition hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{work.name}</h3>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  {(work.multiple ?? 1) > 1 && <p>複数割り当て: {work.multiple}人</p>}
                  {work.is_above !== undefined && (
                    <p>{work.is_above ? '以上割り当て' : '以下割り当て'}</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400">編集</span>
            </div>
            {work.archive && (
              <div className="mt-4">
                <span className="badge-danger">アーカイブ中</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedWork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {editMode ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">当番を編集</h3>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-work-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      当番名
                    </label>
                    <input
                      id="edit-work-name"
                      type="text"
                      className="input-field"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-work-multiple"
                      className="block text-sm font-medium text-gray-700"
                    >
                      複数割り当て数
                    </label>
                    <input
                      id="edit-work-multiple"
                      type="number"
                      className="input-field"
                      value={editFormData.multiple}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          multiple: parseInt(e.target.value, 10),
                        })
                      }
                      min="1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="edit-work-is-above"
                      type="checkbox"
                      className="w-4 h-4"
                      checked={editFormData.is_above}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, is_above: e.target.checked })
                      }
                    />
                    <label
                      htmlFor="edit-work-is-above"
                      className="text-sm font-medium text-gray-700"
                    >
                      以上割り当て（有効にしたら最低でもこの数、無効にしたら最大でもこの数を割り当て）
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="edit-work-archive"
                      type="checkbox"
                      className="w-4 h-4"
                      checked={editFormData.archive}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, archive: e.target.checked })
                      }
                    />
                    <label
                      htmlFor="edit-work-archive"
                      className="text-sm font-medium text-gray-700"
                    >
                      アーカイブにする
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setSelectedWork(null);
                      }}
                      className="btn-secondary flex-1"
                    >
                      キャンセル
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      保存
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedWork.name}</h3>
                    <div className="mt-2 text-sm text-gray-500 space-y-1">
                      {(selectedWork.multiple ?? 1) > 1 && (
                        <p>複数割り当て: {selectedWork.multiple}人</p>
                      )}
                      {selectedWork.is_above !== undefined && (
                        <p>{selectedWork.is_above ? '以上割り当て' : '以下割り当て'}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedWork(null)}
                    className="text-gray-400 hover:text-gray-700 font-bold text-xl"
                  >
                    ✕
                  </button>
                </div>
                {selectedWork.archive && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">この当番はアーカイブ中です</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="btn-primary flex-1"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWork(null)}
                    className="btn-secondary flex-1"
                  >
                    閉じる
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
