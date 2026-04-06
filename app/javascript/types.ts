export interface MemberOptionSetting {
  id: number;
  member_id: number;
  work_id: number;
  work_name: string | null;
  status: number;
  status_label: string;
}

export interface Member {
  id: number;
  family_name: string;
  given_name: string;
  kana_name: string;
  archive: boolean;
  created_at: string;
  updated_at: string;
  member_options?: MemberOptionSetting[];
}

export interface Work {
  id: number;
  name: string;
  multiple?: number;
  archive: boolean;
  is_above: boolean;
  created_at: string;
  updated_at: string;
  members?: Member[];
}

export interface History {
  id: number;
  work_id: number | null;
  member_id: number;
  date: string;
  created_at: string;
  updated_at: string;
  member?: Member;
  work?: Work;
}

export interface ApiError {
  errors?: string[];
  message?: string;
}

export interface HistoryPayload {
  member_id: number;
  work_id: number | null;
  date: string;
}

export interface WorkPayload {
  is_above: boolean;
}
