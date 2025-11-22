'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendPasswordReset(email: string) {
  const supabase = await createClient()

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password/confirm`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
