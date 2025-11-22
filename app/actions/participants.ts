'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Participant } from '@/lib/types/database'

export async function getParticipants() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching participants:', error)
    return []
  }

  return data as Participant[]
}

export async function createParticipant(formData: FormData) {
  const supabase = await createClient()

  const participant = {
    first_name: formData.get('first_name') as string || null,
    last_name: formData.get('last_name') as string || null,
    gender: formData.get('gender') as string || null,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    date_of_birth: formData.get('date_of_birth') as string || null,
    emergency_contact_name: formData.get('emergency_contact_name') as string || null,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string || null,
  }

  // Check for duplicates
  const duplicates = []

  if (participant.email) {
    const { data: emailCheck } = await supabase
      .from('participants')
      .select('id, email')
      .eq('email', participant.email)
      .limit(1)

    if (emailCheck && emailCheck.length > 0) {
      duplicates.push(`Email ${participant.email} is already registered`)
    }
  }

  if (participant.phone) {
    const { data: phoneCheck } = await supabase
      .from('participants')
      .select('id, phone')
      .eq('phone', participant.phone)
      .limit(1)

    if (phoneCheck && phoneCheck.length > 0) {
      duplicates.push(`Phone number ${participant.phone} is already registered`)
    }
  }

  if (duplicates.length > 0) {
    return { error: duplicates.join('. ') }
  }

  const { error } = await supabase
    .from('participants')
    .insert(participant)

  if (error) {
    console.error('Error creating participant:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateParticipant(id: string, formData: FormData) {
  const supabase = await createClient()

  const participant = {
    first_name: formData.get('first_name') as string || null,
    last_name: formData.get('last_name') as string || null,
    gender: formData.get('gender') as string || null,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    date_of_birth: formData.get('date_of_birth') as string || null,
    emergency_contact_name: formData.get('emergency_contact_name') as string || null,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string || null,
  }

  // Check for duplicates (excluding current participant)
  const duplicates = []

  if (participant.email) {
    const { data: emailCheck } = await supabase
      .from('participants')
      .select('id, email')
      .eq('email', participant.email)
      .neq('id', id)
      .limit(1)

    if (emailCheck && emailCheck.length > 0) {
      duplicates.push(`Email ${participant.email} is already registered`)
    }
  }

  if (participant.phone) {
    const { data: phoneCheck } = await supabase
      .from('participants')
      .select('id, phone')
      .eq('phone', participant.phone)
      .neq('id', id)
      .limit(1)

    if (phoneCheck && phoneCheck.length > 0) {
      duplicates.push(`Phone number ${participant.phone} is already registered`)
    }
  }

  if (duplicates.length > 0) {
    return { error: duplicates.join('. ') }
  }

  const { error } = await supabase
    .from('participants')
    .update(participant)
    .eq('id', id)

  if (error) {
    console.error('Error updating participant:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteParticipant(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting participant:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

interface BulkParticipant {
  firstName: string
  lastName: string
  email: string
  gender?: string
}

export async function bulkCreateParticipants(participants: BulkParticipant[]) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  let successCount = 0
  const errors: string[] = []

  for (const p of participants) {
    try {
      // Check for duplicate email
      const { data: existingEmail } = await supabase
        .from('participants')
        .select('id')
        .eq('email', p.email)
        .limit(1)

      if (existingEmail && existingEmail.length > 0) {
        errors.push(`${p.email} already exists`)
        continue
      }

      // Create participant record
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          first_name: p.firstName,
          last_name: p.lastName,
          email: p.email,
          gender: p.gender || null,
          phone: null,
          date_of_birth: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
        })
        .select()
        .single()

      if (participantError) {
        errors.push(`${p.email}: ${participantError.message}`)
        continue
      }

      // Create auth user with a temporary password using admin client
      // User will need to reset password via password reset link
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

      const { error: authError } = await adminClient.auth.admin.createUser({
        email: p.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email to avoid sending confirmation email
        user_metadata: {
          participant_id: participant.id
        }
      })

      if (authError) {
        // If auth creation fails, delete the participant record
        await supabase.from('participants').delete().eq('id', participant.id)
        errors.push(`${p.email}: Failed to create auth account - ${authError.message}`)
        continue
      }

      successCount++
    } catch (err) {
      errors.push(`${p.email}: Unexpected error`)
      console.error(err)
    }
  }

  revalidatePath('/')

  return {
    success: successCount,
    errors: errors
  }
}
