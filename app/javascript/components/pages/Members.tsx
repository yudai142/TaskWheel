import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Member, Work } from '../../types';

interface BulkFormData {
  text: string;
}

interface EditFormData {
  name: string;
  kana: string;
  archive: boolean;
}

interface Props {
  worksheetId: number | null;
  isDemoUser?: boolean;
}

// 日本語テキストをカタカナに変換する簡易実装
const hiraganaToKatakana = (text: string): string => {
  const hiraganaKatakanaMap: { [key: string]: string } = {
    あ: 'ア',
    い: 'イ',
    う: 'ウ',
    え: 'エ',
    お: 'オ',
    か: 'カ',
    き: 'キ',
    く: 'ク',
    け: 'ケ',
    こ: 'コ',
    が: 'ガ',
    ぎ: 'ギ',
    ぐ: 'グ',
    げ: 'ゲ',
    ご: 'ゴ',
    さ: 'サ',
    し: 'シ',
    す: 'ス',
    せ: 'セ',
    そ: 'ソ',
    ざ: 'ザ',
    じ: 'ジ',
    ず: 'ズ',
    ぜ: 'ゼ',
    ぞ: 'ゾ',
    た: 'タ',
    ち: 'チ',
    つ: 'ツ',
    て: 'テ',
    と: 'ト',
    だ: 'ダ',
    ぢ: 'ヂ',
    づ: 'ヅ',
    で: 'デ',
    ど: 'ド',
    な: 'ナ',
    に: 'ニ',
    ぬ: 'ヌ',
    ね: 'ネ',
    の: 'ノ',
    は: 'ハ',
    ひ: 'ヒ',
    ふ: 'フ',
    へ: 'ヘ',
    ほ: 'ホ',
    ば: 'バ',
    び: 'ビ',
    ぶ: 'ブ',
    べ: 'ベ',
    ぼ: 'ボ',
    ぱ: 'パ',
    ぴ: 'ピ',
    ぷ: 'プ',
    ぺ: 'ペ',
    ぽ: 'ポ',
    ま: 'マ',
    み: 'ミ',
    む: 'ム',
    め: 'メ',
    も: 'モ',
    や: 'ヤ',
    ゆ: 'ユ',
    よ: 'ヨ',
    ら: 'ラ',
    り: 'リ',
    る: 'ル',
    れ: 'レ',
    ろ: 'ロ',
    わ: 'ワ',
    ゐ: 'ヰ',
    ゑ: 'ヱ',
    を: 'ヲ',
    ん: 'ン',
    ー: 'ー',
    ' ': ' ',
  };

  return text
    .split('')
    .map((char) => hiraganaKatakanaMap[char] || char)
    .join('');
};

// 基本的な名前予測
const predictKana = (name: string): string => {
  if (/[ぁ-ん]/.test(name)) {
    return hiraganaToKatakana(name);
  }
  if (/[ァ-ン]/.test(name)) {
    return name;
  }

  const commonNameMap: { [key: string]: string } = {
    山田: 'ヤマダ',
    佐藤: 'サトウ',
    鈴木: 'スズキ',
    伊藤: 'イトウ',
    高橋: 'タカハシ',
    渡辺: 'ワタナベ',
    中村: 'ナカムラ',
    小林: 'コバヤシ',
    田中: 'タナカ',
    太郎: 'タロウ',
    次郎: 'ジロウ',
    花子: 'ハナコ',
  };

  for (const [kanji, kana] of Object.entries(commonNameMap)) {
    if (name.includes(kanji)) {
      return name.split(kanji).join(kana);
    }
  }

  return name;
};

export default function Members({ worksheetId, isDemoUser = false }: Props): JSX.Element {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showBulkForm, setShowBulkForm] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [filter, setFilter] = useState<'active' | 'all' | 'archived'>('active');
  const [bulkFormData, setBulkFormData] = useState<BulkFormData>({ text: '' });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    kana: '',
    archive: false,
  });

  useEffect(() => {
    void fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId, filter]);

  const fetchMembers = async (): Promise<void> => {
    try {
      const response = await axios.get<Member[]>('/api/v1/members', {
        params: { filter },
      });
      setMembers(response.data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  // Works are not currently used in this component

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
            name: parts.slice(0, -1).join(' ') || '',
            kana: parts[parts.length - 1] || '',
          };
        })
        .filter((member) => member.name && member.kana);

      if (lines.length === 0) {
        alert('有効なメンバーを入力してください');
        return;
      }

      await axios.post('/api/v1/members/bulk_create', {
        members: lines,
        worksheet_id: worksheetId,
      });

      setBulkFormData({ text: '' });
      setShowBulkForm(false);
      await fetchMembers();
    } catch {
      alert('メンバーの一括追加に失敗しました');
    }
  };

  const handleOpenEditModal = (member: Member): void => {
    setSelectedMember(member);
    setEditFormData({
      name: member.name,
      kana: member.kana,
      archive: member.archive,
    });
    setEditMode(true);
  };

  const handleNameChange = (newName: string): void => {
    setEditFormData({ ...editFormData, name: newName });
    if (!editFormData.kana || editFormData.kana === '') {
      const predicted = predictKana(newName);
      setEditFormData((prev) => ({ ...prev, kana: predicted }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      const response = await axios.patch<Member>(`/api/v1/members/${selectedMember.id}`, {
        member: editFormData,
      });

      setMembers((currentMembers) =>
        currentMembers.map((m) => (m.id === response.data.id ? response.data : m))
      );
      setSelectedMember(null);
      setEditMode(false);
    } catch {
      alert('メンバーの更新に失敗しました');
    }
  };

  if (loading) return <div className="text-center py-12">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">メンバー管理</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'active' | 'all' | 'archived')}
            className="input-field py-2"
          >
            <option value="active">有効なメンバー</option>
            <option value="all">すべて</option>
            <option value="archived">アーカイブ</option>
          </select>
          <button
            onClick={() => setShowBulkForm(!showBulkForm)}
            className="btn-primary"
            disabled={isDemoUser}
            title={isDemoUser ? 'デモアカウントでは使用できません' : ''}
          >
            {showBulkForm ? 'キャンセル' : '一括追加'}
          </button>
        </div>
      </div>

      {showBulkForm && (
        <div className="card">
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label htmlFor="bulk-members" className="block text-sm font-medium text-gray-700">
                メンバーを一括登録
              </label>
              <p className="text-xs text-gray-500 mb-2">
                1行に1メンバー「名前 かな」の形式で入力してください
              </p>
              <textarea
                id="bulk-members"
                className="input-field min-h-[120px] font-mono text-sm"
                value={bulkFormData.text}
                onChange={(e) => setBulkFormData({ text: e.target.value })}
                placeholder="例:&#10;佐藤 太郎 さとう&#10;鈴木 花子 すずき"
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
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => handleOpenEditModal(member)}
            className="card text-left transition hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.kana}</p>
              </div>
              <span className="text-xs font-medium text-gray-400">編集</span>
            </div>
            {member.archive && (
              <div className="mt-4">
                <span className="badge-danger">アーカイブ中</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {editMode ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">メンバーを編集</h3>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                      名前
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      className="input-field"
                      value={editFormData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-kana" className="block text-sm font-medium text-gray-700">
                      かな
                    </label>
                    <input
                      id="edit-kana"
                      type="text"
                      className="input-field"
                      value={editFormData.kana}
                      onChange={(e) => setEditFormData({ ...editFormData, kana: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ※名前を入力するとかなが自動予測されます
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="edit-archive"
                      type="checkbox"
                      className="w-4 h-4"
                      checked={editFormData.archive}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, archive: e.target.checked })
                      }
                    />
                    <label htmlFor="edit-archive" className="text-sm font-medium text-gray-700">
                      アーカイブにする
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setSelectedMember(null);
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
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{selectedMember.name}</h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-gray-500">かな</p>
                    <p className="text-lg text-gray-900">{selectedMember.kana}</p>
                  </div>
                  {selectedMember.archive && (
                    <div>
                      <span className="badge-danger">アーカイブ中</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="btn-secondary flex-1"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="btn-primary flex-1"
                  >
                    編集
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
