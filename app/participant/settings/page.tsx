import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/participant/login')
  }

  // Check if user has participant role
  const userRole = user.user_metadata?.role
  if (userRole === 'admin') {
    redirect('/')
  }

  // Get participant info
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!participant) {
    redirect('/participant/login')
  }

  return <SettingsForm user={user} participant={participant} />
}
