export interface Member {
  id: number
  family_name: string
  given_name: string
  kana_name: string
  archive: boolean
  created_at: string
  updated_at: string
}

export interface OffWorkDate {
  id: number
  date: string
}

export interface Work {
  id: number
  name: string
  multiple: number
  archive: boolean
  is_above: boolean
  members?: Member[]
  off_works?: OffWorkDate[]
  created_at: string
  updated_at: string
}

export interface History {
  id: number
  work_id: number
  member_id: number
  date: string
  work?: Work
  member?: Member
  created_at: string
  updated_at: string
}
