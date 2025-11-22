'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function importExistingEmails(emails: string[]) {
  const supabase = await createClient()

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { error: 'Unauthorized. Admin access required.' }
  }

  const adminClient = createAdminClient()
  const results = []
  const errors = []

  for (const email of emails) {
    try {
      // Validate email format
      if (!email.includes('@') || !email.includes('.')) {
        errors.push({ email, error: 'Invalid email format' })
        continue
      }

      // Check if participant already exists
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('email', email)
        .single()

      if (existingParticipant) {
        errors.push({ email, error: 'Email already exists' })
        continue
      }

      // Create participant record (no auth user yet)
      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert({
          email,
          // Leave other fields null - user will fill them in when claiming account
        })
        .select()
        .single()

      if (participantError) {
        errors.push({ email, error: participantError.message })
        continue
      }

      results.push({ email, participantId: newParticipant.id })
    } catch (error: any) {
      errors.push({ email, error: error.message || 'Unknown error' })
    }
  }

  return {
    success: results.length,
    errors,
    results
  }
}
