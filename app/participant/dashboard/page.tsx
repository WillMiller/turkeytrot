import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ParticipantDashboard from '@/components/ParticipantDashboard'

export default async function ParticipantDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/participant/login')
  }

  // Check if user has participant role (or no role for backward compatibility)
  const userRole = user.user_metadata?.role
  if (userRole === 'admin') {
    // If admin, redirect to admin dashboard
    redirect('/')
  }

  // Get participant info by email
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('email', user.email)

  // Get all race participations with race details and finish times
  const participantIds = participants?.map(p => p.id) || []

  const { data: raceParticipations } = await supabase
    .from('race_participants')
    .select(`
      *,
      race:races(*),
      participant:participants(*),
      finish_time:finish_times(*)
    `)
    .in('participant_id', participantIds)
    .order('created_at', { ascending: false })

  return <ParticipantDashboard user={user} raceParticipations={raceParticipations || []} />
}
