'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Race, RaceParticipant, FinishTime, Participant } from '@/lib/types/database'

export async function getRaces() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: false })

  if (error) {
    console.error('Error fetching races:', error)
    return []
  }

  return data as Race[]
}

export async function createRace(formData: FormData) {
  const supabase = await createClient()

  const race = {
    name: formData.get('name') as string,
    race_date: formData.get('race_date') as string,
  }

  const { error } = await supabase
    .from('races')
    .insert(race)

  if (error) {
    console.error('Error creating race:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateRace(id: string, formData: FormData) {
  const supabase = await createClient()

  const race = {
    name: formData.get('name') as string,
    race_date: formData.get('race_date') as string,
  }

  const { error } = await supabase
    .from('races')
    .update(race)
    .eq('id', id)

  if (error) {
    console.error('Error updating race:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteRace(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('races')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting race:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function getRaceParticipants(raceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('race_participants')
    .select(`
      *,
      participant:participants(*),
      finish_time:finish_times(*)
    `)
    .eq('race_id', raceId)
    .order('bib_number', { ascending: true })

  if (error) {
    console.error('Error fetching race participants:', error)
    return []
  }

  return data.map(item => ({
    ...item,
    finish_time: Array.isArray(item.finish_time) && item.finish_time.length > 0 ? item.finish_time[0] : undefined
  }))
}

export async function addParticipantToRace(raceId: string, participantId: string, bibNumber: number) {
  const supabase = await createClient()

  // Check if bib number is already taken
  const { data: existingBib } = await supabase
    .from('race_participants')
    .select('id')
    .eq('race_id', raceId)
    .eq('bib_number', bibNumber)
    .limit(1)

  if (existingBib && existingBib.length > 0) {
    return { error: `Bib number ${bibNumber} is already assigned` }
  }

  // Check if participant is already in this race
  const { data: existingParticipant } = await supabase
    .from('race_participants')
    .select('id')
    .eq('race_id', raceId)
    .eq('participant_id', participantId)
    .limit(1)

  if (existingParticipant && existingParticipant.length > 0) {
    return { error: 'Participant is already in this race' }
  }

  const { error } = await supabase
    .from('race_participants')
    .insert({
      race_id: raceId,
      participant_id: participantId,
      bib_number: bibNumber,
    })

  if (error) {
    console.error('Error adding participant to race:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function removeParticipantFromRace(raceParticipantId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('race_participants')
    .delete()
    .eq('id', raceParticipantId)

  if (error) {
    console.error('Error removing participant from race:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateBibNumber(raceParticipantId: string, newBibNumber: number, raceId: string) {
  const supabase = await createClient()

  // Check if new bib number is already taken by another participant
  const { data: existingBib } = await supabase
    .from('race_participants')
    .select('id')
    .eq('race_id', raceId)
    .eq('bib_number', newBibNumber)
    .neq('id', raceParticipantId)
    .limit(1)

  if (existingBib && existingBib.length > 0) {
    return { error: `Bib number ${newBibNumber} is already assigned` }
  }

  const { error } = await supabase
    .from('race_participants')
    .update({ bib_number: newBibNumber })
    .eq('id', raceParticipantId)

  if (error) {
    console.error('Error updating bib number:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function startRace(raceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('races')
    .update({ start_time: new Date().toISOString() })
    .eq('id', raceId)

  if (error) {
    console.error('Error starting race:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function recordFinishTime(raceId: string, bibNumber: number) {
  const supabase = await createClient()

  // Find the race participant by bib number
  const { data: raceParticipant, error: findError } = await supabase
    .from('race_participants')
    .select('id')
    .eq('race_id', raceId)
    .eq('bib_number', bibNumber)
    .single()

  if (findError || !raceParticipant) {
    return { error: `Bib number ${bibNumber} not found in this race` }
  }

  // Check if finish time already exists
  const { data: existingFinish } = await supabase
    .from('finish_times')
    .select('id')
    .eq('race_participant_id', raceParticipant.id)
    .single()

  if (existingFinish) {
    return { error: `Bib number ${bibNumber} has already finished` }
  }

  const { error } = await supabase
    .from('finish_times')
    .insert({
      race_participant_id: raceParticipant.id,
      finish_time: new Date().toISOString(),
    })

  if (error) {
    console.error('Error recording finish time:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateFinishTime(finishTimeId: string, newFinishTime: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('finish_times')
    .update({ adjusted_time: newFinishTime })
    .eq('id', finishTimeId)

  if (error) {
    console.error('Error updating finish time:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
