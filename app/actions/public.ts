'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function registerUser(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Create user account with participant role
  // Note: Email confirmation is controlled in Supabase dashboard settings
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'participant'
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account' }
  }

  // Create participant record
  const participantData = {
    id: authData.user!.id, // Use auth user ID as participant ID
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    gender: formData.get('gender') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    email: email,
    phone: formData.get('phone') as string,
    emergency_contact_name: formData.get('emergency_contact_name') as string,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string,
  }

  const { error: participantError } = await supabase
    .from('participants')
    .insert(participantData)

  if (participantError) {
    // If participant creation fails, delete the auth user
    await supabase.auth.admin.deleteUser(authData.user!.id)
    return { error: participantError.message }
  }

  // Register for selected races (without bib numbers)
  const selectedRacesJson = formData.get('selected_races') as string
  if (selectedRacesJson) {
    try {
      const selectedRaces = JSON.parse(selectedRacesJson) as string[]

      if (selectedRaces.length > 0) {
        // Create race_participants entries WITHOUT bib numbers (set to null)
        const raceParticipants = selectedRaces.map((raceId) => ({
          race_id: raceId,
          participant_id: authData.user!.id,
          bib_number: null, // Will be assigned by admin before race day
        }))

        await supabase
          .from('race_participants')
          .insert(raceParticipants)
      }
    } catch (e) {
      console.error('Error registering for races:', e)
      // Don't fail the whole operation
    }
  }

  revalidatePath('/participant/dashboard')
  redirect('/participant/dashboard')
}

export async function getAvailableRaces() {
  const supabase = await createClient()

  const { data: races, error } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { races }
}

export async function updateEmergencyContactAndRegisterForRaces(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to register for races' }
  }

  // Update participant emergency contact info
  const { error: updateError } = await supabase
    .from('participants')
    .update({
      emergency_contact_name: formData.get('emergency_contact_name') as string,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Register for selected races (without bib numbers)
  const selectedRacesJson = formData.get('selected_races') as string
  if (selectedRacesJson) {
    try {
      const selectedRaces = JSON.parse(selectedRacesJson) as string[]

      if (selectedRaces.length > 0) {
        // Create race_participants entries WITHOUT bib numbers (set to null)
        const raceParticipants = selectedRaces.map((raceId) => ({
          race_id: raceId,
          participant_id: user.id,
          bib_number: null, // Will be assigned by admin before race day
        }))

        const { error: raceError } = await supabase
          .from('race_participants')
          .insert(raceParticipants)

        if (raceError) {
          return { error: raceError.message }
        }
      }
    } catch (e) {
      console.error('Error registering for races:', e)
      return { error: 'Failed to register for races' }
    }
  }

  revalidatePath('/participant/dashboard')
  return { success: true }
}
