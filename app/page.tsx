import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If no user, show public home page
  if (!user) {
    redirect('/home')
  }

  // Check if user has admin role
  const userRole = user.user_metadata?.role
  if (userRole !== 'admin') {
    // If participant, redirect to participant dashboard
    if (userRole === 'participant') {
      redirect('/participant/dashboard')
    }
    // If no role or invalid role, sign out and redirect to home page
    await supabase.auth.signOut()
    redirect('/home')
  }

  return <Dashboard />
}
