'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registerForAdditionalRaces(raceIds: string[]) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to register for races' }
  }

  // Get participant record
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('email', user.email)
    .single()

  if (participantError || !participant) {
    return { error: 'Participant record not found' }
  }

  // Check if already registered for any of these races
  const { data: existingRegistrations } = await supabase
    .from('race_participants')
    .select('race_id')
    .eq('participant_id', participant.id)
    .in('race_id', raceIds)

  const alreadyRegistered = existingRegistrations?.map(r => r.race_id) || []
  const newRaceIds = raceIds.filter(id => !alreadyRegistered.includes(id))

  if (newRaceIds.length === 0) {
    return { error: 'You are already registered for all selected races' }
  }

  // Create race_participants entries WITHOUT bib numbers (set to null)
  // Admin will assign bib numbers later
  const raceParticipants = newRaceIds.map((raceId) => ({
    race_id: raceId,
    participant_id: participant.id,
    bib_number: null, // Will be assigned by admin before race day
  }))

  const { error: insertError } = await supabase
    .from('race_participants')
    .insert(raceParticipants)

  if (insertError) {
    return { error: 'Failed to register for races: ' + insertError.message }
  }

  revalidatePath('/participant/dashboard')
  return { success: true }
}

export async function updateParticipantInfo(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to update your information' }
  }

  // Update participant info
  const { error: updateError } = await supabase
    .from('participants')
    .update({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      gender: formData.get('gender') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      phone: formData.get('phone') as string,
      emergency_contact_name: formData.get('emergency_contact_name') as string,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string,
    })
    .eq('email', user.email)

  if (updateError) {
    return { error: 'Failed to update information: ' + updateError.message }
  }

  revalidatePath('/participant/settings')
  revalidatePath('/participant/dashboard')
  return { success: true }
}
