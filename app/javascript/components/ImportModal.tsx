import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Member, Work, Worksheet } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  importType: 'members' | 'works';
  currentWorksheetId: number | null;
  isDemoUser?: boolean;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImportComplete,
  importType,
  currentWorksheetId,
  isDemoUser = false,
}: ImportModalProps): JSX.Element | null {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [selectedSourceWorksheet, setSelectedSourceWorksheet] = useState<number | ''>('');
  const [sourceWorksheetItems, setSourceWorksheetItems] = useState<(Member | Work)[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [fetchingItems, setFetchingItems] = useState<boolean>(false);

  // ワークシート一覧を取得
  useEffect(() => {
    const fetchWorksheets = async (): Promise<void> => {
      try {
        const response = await axios.get<Worksheet[]>('/api/v1/worksheets/importable');
        setWorksheets(response.data);
      } catch {
        alert('ワークシート一覧の取得に失敗しました');
      }
    };

    if (isOpen) {
      setLoading(true);
      void fetchWorksheets();
      setSelectedSourceWorksheet('');
      setSourceWorksheetItems([]);
      setSelectedItems(new Set());
      setLoading(false);
    }
  }, [isOpen]);

  // インポート元ワークシートのメンバー/タスク一覧を取得
  useEffect(() => {
    const fetchSourceItems = async (): Promise<void> => {
      if (!selectedSourceWorksheet) {
        setSourceWorksheetItems([]);
        setSelectedItems(new Set());
        return;
      }

      setFetchingItems(true);
      try {
        const endpoint = importType === 'members' ? '/api/v1/members' : '/api/v1/works';
        const response = await axios.get<Member[] | Work[]>(endpoint, {
          params: {
            worksheet_id: selectedSourceWorksheet,
            include_settings: importType === 'members' ? 'false' : undefined,
          },
        });
        setSourceWorksheetItems(response.data);
        setSelectedItems(new Set());
      } catch {
        alert('インポート対象の取得に失敗しました');
        setSourceWorksheetItems([]);
      } finally {
        setFetchingItems(false);
      }
    };

    void fetchSourceItems();
  }, [selectedSourceWorksheet, importType]);

  const handleSelectItem = (itemId: number): void => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (): void => {
    if (selectedItems.size === sourceWorksheetItems.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = sourceWorksheetItems.map((item: Member | Work) => item.id);
      setSelectedItems(new Set(allIds));
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!selectedSourceWorksheet || !currentWorksheetId || selectedItems.size === 0) {
      alert('ワークシートと対象項目を選択してください');
      return;
    }

    setImporting(true);
    try {
      const itemIds = Array.from(selectedItems);

      const requestPayload =
        importType === 'members'
          ? {
              source_worksheet_id: selectedSourceWorksheet,
              target_worksheet_id: currentWorksheetId,
              member_ids: itemIds,
            }
          : {
              source_worksheet_id: selectedSourceWorksheet,
              target_worksheet_id: currentWorksheetId,
              work_ids: itemIds,
            };

      console.log(`Importing ${importType}:`, requestPayload);

      const endpoint = importType === 'members' ? '/api/v1/members/import' : '/api/v1/works/import';

      const response = await axios.post(endpoint, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Import successful:', response.data);
      alert('インポートが完了しました');
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('インポートエラー:', error);
      let errorMessage = 'インポートに失敗しました';

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as Record<string, unknown> | undefined;

        // エラーメッセージの順序: error → message → status テキスト
        if (data?.error) {
          errorMessage = String(data.error);
        } else if (data?.message) {
          errorMessage = String(data.message);
        } else if (status) {
          errorMessage = `HTTPエラー ${status}`;
        } else {
          errorMessage = error.message || 'インポートに失敗しました';
        }

        console.error(`API Error - Status: ${status}, Message: ${errorMessage}`);
      }

      alert(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const itemLabel = importType === 'members' ? 'メンバー' : 'タスク';
  const allSelected =
    selectedItems.size === sourceWorksheetItems.length && sourceWorksheetItems.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{itemLabel}をインポート</h3>

        {/* ワークシート選択 */}
        <div className="mb-6">
          <label
            htmlFor="import-source-ws"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            インポート元ワークシート
          </label>
          <select
            id="import-source-ws"
            value={selectedSourceWorksheet}
            onChange={(e) =>
              setSelectedSourceWorksheet(e.target.value ? Number(e.target.value) : '')
            }
            className="input-field"
            disabled={loading || isDemoUser}
          >
            <option value="">選択してください</option>
            {worksheets.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        {/* 項目選択 */}
        {selectedSourceWorksheet && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">インポートする{itemLabel}を選択</h4>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                disabled={isDemoUser || fetchingItems || sourceWorksheetItems.length === 0}
                type="button"
              >
                {allSelected ? 'すべて解除' : 'すべて選択'}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
              {fetchingItems ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {itemLabel}を読み込み中...
                </div>
              ) : sourceWorksheetItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  インポート対象がありません
                </div>
              ) : (
                <div className="space-y-0">
                  {(sourceWorksheetItems as (Member | Work)[]).map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={isDemoUser}
                      />
                      <span className="ml-3 text-sm text-gray-900">
                        {importType === 'members' && 'name' in item ? (
                          <>
                            <strong>{(item as Member).name}</strong>
                            <span className="text-gray-500 ml-2">{(item as Member).kana}</span>
                          </>
                        ) : (
                          <strong>{(item as Work).name}</strong>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={importing || isDemoUser}
            type="button"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            className="btn-primary"
            disabled={
              importing || !selectedSourceWorksheet || selectedItems.size === 0 || isDemoUser
            }
            type="button"
          >
            {importing ? 'インポート中...' : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}
