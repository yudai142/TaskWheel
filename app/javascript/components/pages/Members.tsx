import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Member, Work, MemberOptionSetting } from '../../types';
import ImportModal from '../ImportModal';

interface BulkFormData {
  text: string;
}

interface EditFormData {
  name: string;
  kana: string;
  archive: boolean;
}

interface SettingFormData {
  work_id: string;
  status: string;
}

interface Props {
  worksheetId: number | null;
  isDemoUser?: boolean;
}

// ひらがな予測関数（ひらがナ返却用）
const predictKanaHiragana = (name: string): string => {
  // ひらがなが含まれていたら、そのままひらがなを返す
  if (/[ぁ-ん]/.test(name)) {
    return name;
  }

  // カタカナからひらがなに変換するマップ
  const katakanaHiraganaMap: { [key: string]: string } = {
    ア: 'あ',
    イ: 'い',
    ウ: 'う',
    エ: 'え',
    オ: 'お',
    カ: 'か',
    キ: 'き',
    ク: 'く',
    ケ: 'け',
    コ: 'こ',
    ガ: 'が',
    ギ: 'ぎ',
    グ: 'ぐ',
    ゲ: 'げ',
    ゴ: 'ご',
    サ: 'さ',
    シ: 'し',
    ス: 'す',
    セ: 'せ',
    ソ: 'そ',
    ザ: 'ざ',
    ジ: 'じ',
    ズ: 'ず',
    ゼ: 'ぜ',
    ゾ: 'ぞ',
    タ: 'た',
    チ: 'ち',
    ツ: 'つ',
    テ: 'て',
    ト: 'と',
    ダ: 'だ',
    ヂ: 'ぢ',
    ヅ: 'づ',
    デ: 'で',
    ド: 'ど',
    ナ: 'な',
    ニ: 'に',
    ヌ: 'ぬ',
    ネ: 'ね',
    ノ: 'の',
    ハ: 'は',
    ヒ: 'ひ',
    フ: 'ふ',
    ヘ: 'へ',
    ホ: 'ほ',
    バ: 'ば',
    ビ: 'び',
    ブ: 'ぶ',
    ベ: 'べ',
    ボ: 'ぼ',
    パ: 'ぱ',
    ピ: 'ぴ',
    プ: 'ぷ',
    ペ: 'ぺ',
    ポ: 'ぽ',
    マ: 'ま',
    ミ: 'み',
    ム: 'む',
    メ: 'め',
    モ: 'も',
    ヤ: 'や',
    ユ: 'ゆ',
    ヨ: 'よ',
    ラ: 'ら',
    リ: 'り',
    ル: 'る',
    レ: 'れ',
    ロ: 'ろ',
    ワ: 'わ',
    ヰ: 'ゐ',
    ヱ: 'ゑ',
    ヲ: 'を',
    ン: 'ん',
    ー: 'ー',
    ' ': ' ',
  };

  const commonNameMapHiragana: { [key: string]: string } = {
    山田: 'やまだ',
    佐藤: 'さとう',
    鈴木: 'すずき',
    伊藤: 'いとう',
    高橋: 'たかはし',
    渡辺: 'わたなべ',
    中村: 'なかむら',
    小林: 'こばやし',
    田中: 'たなか',
    太郎: 'たろう',
    次郎: 'じろう',
    花子: 'はなこ',
  };

  // カタカナをひらがなに変換
  if (/[ァ-ン]/.test(name)) {
    return name
      .split('')
      .map((char) => katakanaHiraganaMap[char] || char)
      .join('');
  }

  // 漢字の辞書マップで対応するひらがなに変換
  for (const [kanji, kana] of Object.entries(commonNameMapHiragana)) {
    if (name.includes(kanji)) {
      return name.split(kanji).join(kana);
    }
  }

  return name;
};

export default function Members({ worksheetId, isDemoUser = false }: Props): JSX.Element {
  const [members, setMembers] = useState<Member[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showBulkForm, setShowBulkForm] = useState<boolean>(false);
  const [showSingleForm, setShowSingleForm] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filter, setFilter] = useState<'active' | 'all' | 'archived'>('active');
  const [bulkFormData, setBulkFormData] = useState<BulkFormData>({ text: '' });
  const [singleFormData, setSingleFormData] = useState<EditFormData>({
    name: '',
    kana: '',
    archive: false,
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    kana: '',
    archive: false,
  });
  const [settingForm, setSettingForm] = useState<SettingFormData>({
    work_id: '',
    status: '0',
  });
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const handleDemoUserAction = (actionName: string): void => {
    if (isDemoUser) {
      alert(`デモアカウントではメンバーを${actionName}できません`);
      return;
    }
  };

  const handleBulkFormToggle = (): void => {
    handleDemoUserAction('追加');
    if (!isDemoUser) {
      setShowBulkForm(!showBulkForm);
      setShowSingleForm(false);
    }
  };

  const handleSingleFormToggle = (): void => {
    handleDemoUserAction('追加');
    if (!isDemoUser) {
      setShowSingleForm(!showSingleForm);
      setShowBulkForm(false);
    }
  };

  const handleImportModalOpen = (): void => {
    handleDemoUserAction('インポート');
    if (!isDemoUser) {
      setShowImportModal(true);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId, filter]);

  const fetchData = async (): Promise<void> => {
    try {
      const [membersResponse, worksResponse] = await Promise.all([
        axios.get<Member[]>('/api/v1/members', {
          params: {
            filter,
            include_archived: 'true',
            include_settings: 'true',
            worksheet_id: worksheetId,
          },
        }),
        axios.get<Work[]>('/api/v1/works', {
          params: { worksheet_id: worksheetId },
        }),
      ]);
      setMembers(membersResponse.data);
      setWorks(worksResponse.data);
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
      alert('メンバーを一括登録しました');
      await fetchData();
    } catch {
      alert('メンバーの一括追加に失敗しました');
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!worksheetId) return;

    try {
      await axios.post<Member>('/api/v1/members', {
        member: singleFormData,
      });

      setSingleFormData({ name: '', kana: '', archive: false });
      setShowSingleForm(false);
      alert('メンバーを登録しました');
      await fetchData();
    } catch {
      alert('メンバーの追加に失敗しました');
    }
  };

  const handleSingleFormKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleOpenEditModal = (member: Member): void => {
    setSelectedMember(member);
    setEditFormData({
      name: member.name,
      kana: member.kana,
      archive: member.archive,
    });
    setSettingForm({ work_id: '', status: '0' });
  };

  const handleNameChange = (newName: string): void => {
    setEditFormData((prev) => {
      const predicted = predictKanaHiragana(newName);
      return {
        ...prev,
        name: newName,
        kana: predicted,
      };
    });
  };

  const handleEditFormKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedMember) return;

    if (isDemoUser) {
      alert('デモユーザーはメンバー情報を編集できません');
      return;
    }

    try {
      const response = await axios.patch<Member>(`/api/v1/members/${selectedMember.id}`, {
        member: editFormData,
      });

      setMembers((currentMembers) =>
        currentMembers.map((m) => (m.id === response.data.id ? response.data : m))
      );
      setSelectedMember(null);
    } catch {
      alert('メンバーの更新に失敗しました');
    }
  };

  const handleAddSetting = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (selectedMember === null) return;

    try {
      await axios.post<MemberOptionSetting>('/api/v1/member_options', {
        member_option: {
          member_id: selectedMember.id,
          work_id: Number(settingForm.work_id),
          status: Number(settingForm.status),
        },
      });
      setSettingForm({ work_id: '', status: '0' });
      await fetchData();
      const response = await axios.get<Member[]>('/api/v1/members', {
        params: { include_archived: 'true', include_settings: 'true' },
      });
      const updatedMember = response.data.find((member) => member.id === selectedMember.id) ?? null;
      setMembers(response.data);
      setSelectedMember(updatedMember);
    } catch {
      alert('設定の追加に失敗しました');
    }
  };

  const handleDeleteSetting = async (settingId: number): Promise<void> => {
    if (selectedMember === null) return;

    try {
      await axios.delete(`/api/v1/member_options/${settingId}`);
      const response = await axios.get<Member[]>('/api/v1/members', {
        params: { include_archived: 'true', include_settings: 'true' },
      });
      const updatedMember = response.data.find((member) => member.id === selectedMember.id) ?? null;
      setMembers(response.data);
      setSelectedMember(updatedMember);
    } catch {
      alert('設定の解除に失敗しました');
    }
  };

  if (loading) return <div className="text-center py-12">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">メンバー管理</h2>
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'active' | 'all' | 'archived')}
            className="input-field py-1"
          >
            <option value="active">有効なメンバー</option>
            <option value="all">すべて</option>
            <option value="archived">アーカイブ</option>
          </select>
          <button
            onClick={handleBulkFormToggle}
            disabled={isDemoUser}
            className={`btn-primary py-1 whitespace-nowrap ${isDemoUser ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="一括追加"
          >
            {showBulkForm ? 'キャンセル' : '一括追加'}
          </button>
          <button
            onClick={handleSingleFormToggle}
            disabled={isDemoUser}
            className={`btn-primary py-1 whitespace-nowrap ${isDemoUser ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="新規登録"
          >
            {showSingleForm ? 'キャンセル' : '新規登録'}
          </button>
          <button
            onClick={handleImportModalOpen}
            disabled={members.length === 0 || isDemoUser}
            disabled={members.length === 0}
            title={members.length === 0 ? 'インポート対象がありません' : 'インポート'}
          >
            インポート
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

      {showSingleForm && (
        <div className="card">
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label htmlFor="single-name" className="block text-sm font-medium text-gray-700">
                名前
              </label>
              <input
                id="single-name"
                type="text"
                className="input-field"
                value={singleFormData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setSingleFormData((prev) => {
                    const predicted = predictKanaHiragana(newName);
                    return {
                      ...prev,
                      name: newName,
                      kana: predicted,
                    };
                  });
                }}
                onKeyDown={handleSingleFormKeyDown}
                placeholder="例：山田太郎"
                required
              />
            </div>
            <div>
              <label htmlFor="single-kana" className="block text-sm font-medium text-gray-700">
                かな
              </label>
              <input
                id="single-kana"
                type="text"
                className="input-field"
                value={singleFormData.kana}
                onChange={(e) => setSingleFormData({ ...singleFormData, kana: e.target.value })}
                onKeyDown={handleSingleFormKeyDown}
                placeholder="例：やまただろう"
                required
              />
              <p className="text-xs text-gray-500 mt-1">※名前を入力するとかなが自動予測されます</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                登録
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => handleOpenEditModal(member)}
            disabled={isDemoUser}
            className={`card text-left transition ${isDemoUser ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl my-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">メンバーを編集</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* 左：メンバー編集フォーム */}
              <div>
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
                      onKeyDown={handleEditFormKeyDown}
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
                      onKeyDown={handleEditFormKeyDown}
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
                      onClick={() => setSelectedMember(null)}
                      className="btn-secondary flex-1"
                    >
                      キャンセル
                    </button>
                    <button type="submit" disabled={isDemoUser} className={`btn-primary flex-1 ${isDemoUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      保存
                    </button>
                  </div>
                </form>
              </div>

              {/* 右：固定/除外設定パネル */}
              <div className="border-l border-gray-200 pl-6">
                <form
                  onSubmit={handleAddSetting}
                  className="space-y-4 rounded-xl border border-gray-200 p-4"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">固定/除外設定を追加</h4>
                    <p className="text-sm text-gray-500">タスク名と設定種別を選んで登録します。</p>
                  </div>
                  <div>
                    <label
                      htmlFor="member-setting-work"
                      className="block text-sm font-medium text-gray-700"
                    >
                      タスク名
                    </label>
                    <select
                      id="member-setting-work"
                      className="input-field"
                      value={settingForm.work_id}
                      onChange={(e) => setSettingForm({ ...settingForm, work_id: e.target.value })}
                      required
                    >
                      <option value="">タスクを選択</option>
                      {works.map((work) => (
                        <option key={work.id} value={String(work.id)}>
                          {work.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="member-setting-status"
                      className="block text-sm font-medium text-gray-700"
                    >
                      設定種別
                    </label>
                    <select
                      id="member-setting-status"
                      className="input-field"
                      value={settingForm.status}
                      onChange={(e) => setSettingForm({ ...settingForm, status: e.target.value })}
                    >
                      <option value="0">固定</option>
                      <option value="1">除外</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isDemoUser} className={`btn-primary w-full ${isDemoUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    設定を追加
                  </button>
                </form>

                {/* 現在の設定一覧 */}
                <div className="rounded-xl border border-gray-200 p-4 mt-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">現在の設定</h4>
                    <p className="text-sm text-gray-500">
                      このメンバーに対して登録済みの固定/除外設定です。
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(selectedMember.member_options ?? []).length === 0 && (
                      <p className="text-sm text-gray-500">まだ設定はありません。</p>
                    )}
                    {(selectedMember.member_options ?? []).map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{option.work_name}</p>
                          <p className="text-sm text-gray-500">{option.status_label}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSetting(option.id)}
                          disabled={isDemoUser}
                          className={`text-sm font-medium ${isDemoUser ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                        >
                          解除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={fetchData}
        importType="members"
        currentWorksheetId={worksheetId}
        isDemoUser={isDemoUser}
      />
    </div>
  );
}
