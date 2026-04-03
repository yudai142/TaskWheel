export interface Member {
  id: number
  family_name: string
  given_name: string
  kana_name: string
  archive: boolean
  created_at: string
  updated_at: string
}

export interface Work {
  id: number
  name: string
  multiple?: number
  archive: boolean
  is_above: boolean
  created_at: string
  updated_at: string
}

export interface History {
  id: number
  work_id: number | null
  member_id: number
  date: string
  created_at: string
  updated_at: string
  member?: Member
}

export interface ApiError {
  errors?: string[]
  message?: string
}

export interface HistoryPayload {
  member_id: number
  work_id: number | null
  date: string
}

export interface WorkPayload {
  is_above: boolean
}
