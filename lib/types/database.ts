export type Participant = {
  id: string
  first_name: string | null
  last_name: string | null
  gender: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  updated_at: string
}

export type Race = {
  id: string
  name: string
  race_date: string
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string
}

export type RaceParticipant = {
  id: string
  race_id: string
  participant_id: string
  bib_number: number
  created_at: string
  updated_at: string
}

export type FinishTime = {
  id: string
  race_participant_id: string
  finish_time: string
  adjusted_time: string | null
  created_at: string
  updated_at: string
}

export type RaceParticipantWithDetails = RaceParticipant & {
  participant: Participant
  finish_time?: FinishTime
}

export type RaceWithParticipants = Race & {
  race_participants: RaceParticipantWithDetails[]
}

export type AgeGroup = '0-12' | '13-17' | '18-29' | '30-39' | '40-49' | '50-59' | '60+'

export type PlacementResult = {
  race_participant_id: string
  bib_number: number
  participant: Participant
  finish_time: string
  finish_time_id: string
  elapsed_time: number
  overall_place: number
  gender_place: number | null
  age_group: AgeGroup | null
  age_group_place: number | null
}
