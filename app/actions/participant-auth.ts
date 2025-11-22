'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function participantLogin(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // Check if user has participant role (or no role for backward compatibility)
  const userRole = authData.user?.user_metadata?.role
  if (userRole && userRole !== 'participant') {
    await supabase.auth.signOut()
    return { error: 'Access denied. Please use the admin login page.' }
  }

  revalidatePath('/participant/dashboard', 'layout')
  redirect('/participant/dashboard')
}

export async function participantSignup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        role: 'participant'
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/participant/dashboard', 'layout')
  redirect('/participant/dashboard')
}

export async function participantSignout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/participant/login', 'layout')
  redirect('/participant/login')
}
