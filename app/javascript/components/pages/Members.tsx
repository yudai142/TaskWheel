import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Member, Work, MemberOptionSetting } from '../../types';

interface MemberFormData {
  family_name: string;
  given_name: string;
  kana_name: string;
}

interface Props {
  worksheetId: number | null;
}

export default function Members({ worksheetId }: Props): JSX.Element {
  const [members, setMembers] = useState<Member[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [settingForm, setSettingForm] = useState<{ work_id: string; status: string }>({
    work_id: '',
    status: '0',
  });
  const [formData, setFormData] = useState<MemberFormData>({
    family_name: '',
    given_name: '',
    kana_name: '',
  });

  useEffect(() => {
    void fetchMembers();
  }, [worksheetId]);

  const fetchMembers = async (): Promise<void> => {
    try {
      const [membersResponse, worksResponse] = await Promise.all([
        axios.get<Member[]>('/api/v1/members', {
          params: { include_archived: 'true', include_settings: 'true', worksheet_id: worksheetId },
        }),
        axios.get<Work[]>('/api/v1/works', {
          params: { worksheet_id: worksheetId },
        }),
      ]);
      setMembers(membersResponse.data);
      setWorks(
        worksResponse.data.filter((work) => !work.archive).sort((left, right) => left.id - right.id)
      );
    } catch {
      // Error fetching members
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/members', { member: formData });
      setFormData({ family_name: '', given_name: '', kana_name: '' });
      setShowForm(false);
      await fetchMembers();
    } catch {
      alert('メンバーの追加に失敗しました');
    }
  };

  const handleArchiveToggle = async (): Promise<void> => {
    if (selectedMember === null) return;

    try {
      const response = await axios.patch<Member>(`/api/v1/members/${selectedMember.id}`, {
        member: { archive: !selectedMember.archive },
      });
      const updatedMember = response.data;
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === updatedMember.id ? { ...member, ...updatedMember } : member
        )
      );
      setSelectedMember((currentMember) =>
        currentMember === null ? null : { ...currentMember, archive: updatedMember.archive }
      );
    } catch {
      alert('アーカイブ状態の更新に失敗しました');
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
      await fetchMembers();
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
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="member-family-name"
                className="block text-sm font-medium text-gray-700"
              >
                苗字
              </label>
              <input
                id="member-family-name"
                type="text"
                className="input-field"
                value={formData.family_name}
                onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label
                htmlFor="member-given-name"
                className="block text-sm font-medium text-gray-700"
              >
                名前
              </label>
              <input
                id="member-given-name"
                type="text"
                className="input-field"
                value={formData.given_name}
                onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="member-kana-name" className="block text-sm font-medium text-gray-700">
                かな名
              </label>
              <input
                id="member-kana-name"
                type="text"
                className="input-field"
                value={formData.kana_name}
                onChange={(e) => setFormData({ ...formData, kana_name: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              追加
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => setSelectedMember(member)}
            className="card text-left transition hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {member.family_name}
                  {member.given_name}
                </h3>
                <p className="text-sm text-gray-500">{member.kana_name}</p>
              </div>
              <span className="text-xs font-medium text-gray-400">設定</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {member.archive && <span className="badge-danger">アーカイブ中</span>}
              {(member.member_options ?? []).slice(0, 3).map((option) => (
                <span
                  key={option.id}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                >
                  {option.work_name}:{option.status_label}
                </span>
              ))}
              {(member.member_options?.length ?? 0) > 3 && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  +{(member.member_options?.length ?? 0) - 3}件
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedMember.family_name}
                  {selectedMember.given_name}
                </h3>
                <p className="text-sm text-gray-500">{selectedMember.kana_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                閉じる
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">メンバー状態</p>
                  <p className="text-sm text-gray-500">
                    アーカイブの有効/無効をここで切り替えます。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleArchiveToggle}
                  className={selectedMember.archive ? 'btn-primary' : 'btn-secondary'}
                >
                  {selectedMember.archive ? 'アーカイブを解除' : 'アーカイブにする'}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <form
                onSubmit={handleAddSetting}
                className="space-y-4 rounded-xl border border-gray-200 p-4"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">固定/除外設定を追加</h4>
                  <p className="text-sm text-gray-500">当番名と設定種別を選んで登録します。</p>
                </div>
                <div>
                  <label
                    htmlFor="member-setting-work"
                    className="block text-sm font-medium text-gray-700"
                  >
                    当番名
                  </label>
                  <select
                    id="member-setting-work"
                    className="input-field"
                    value={settingForm.work_id}
                    onChange={(e) => setSettingForm({ ...settingForm, work_id: e.target.value })}
                    required
                  >
                    <option value="">当番を選択</option>
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
                <button type="submit" className="btn-primary w-full">
                  設定を追加
                </button>
              </form>

              <div className="rounded-xl border border-gray-200 p-4">
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
                        className="text-sm font-medium text-red-500 hover:text-red-700"
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
      )}
    </div>
  );
}
