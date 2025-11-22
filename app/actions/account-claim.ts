'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendClaimAccountEmail(email: string) {
  const supabase = await createClient()
  const adminClient = await import('@/lib/supabase/admin').then(m => m.createAdminClient())

  // Check if user exists in participants table
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id, email, first_name, last_name')
    .eq('email', email)
    .single()

  if (participantError || !participant) {
    return { error: 'No account found with this email address' }
  }

  // Check if auth user already exists
  const { data: existingAuthUsers } = await adminClient.auth.admin.listUsers()
  const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === email)

  if (existingAuthUser) {
    // If auth user exists, just send password reset
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/claim-account/complete`,
    })

    if (resetError) {
      return { error: resetError.message }
    }
  } else {
    // Create auth user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'participant'
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    // Update participant record with auth user ID
    await supabase
      .from('participants')
      .update({ id: authData.user.id })
      .eq('email', email)

    // Send password reset email so they can set their own password
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/claim-account/complete`,
    })

    if (resetError) {
      return { error: resetError.message }
    }
  }

  return {
    success: true,
    message: 'Password setup link sent! Check your email to continue.'
  }
}

export async function updateAccountInfo(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to update your account' }
  }

  // Update participant record with additional info
  const { error: updateError } = await supabase
    .from('participants')
    .update({
      emergency_contact_name: formData.get('emergency_contact_name') as string,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string,
      phone: formData.get('phone') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: formData.get('gender') as string,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Update user metadata to set role
  const { error: metadataError } = await supabase.auth.updateUser({
    data: { role: 'participant' }
  })

  if (metadataError) {
    return { error: metadataError.message }
  }

  revalidatePath('/participant/dashboard')
  return { success: true }
}
