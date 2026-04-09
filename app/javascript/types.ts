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
  name: string;
  kana: string;
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

export interface WorksheetSummary {
  id: number;
  name: string | null;
  interval: number;
  week_use: boolean;
  week: number;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  provider: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  user: AuthUser | null;
  current_worksheet: WorksheetSummary | null;
  error?: string;
  errors?: string[];
}
