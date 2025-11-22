'use client'

import { useState } from 'react'
import { participantSignout } from '@/app/actions/participant-auth'
import type { User } from '@supabase/supabase-js'

interface RaceParticipation {
  id: string
  bib_number: number
  race: {
    id: string
    name: string
    race_date: string
    start_time: string | null
  }
  participant: {
    first_name: string | null
    last_name: string | null
  }
  finish_time?: {
    finish_time: string
    adjusted_time: string | null
  } | null
}

interface ParticipantDashboardProps {
  user: User
  raceParticipations: RaceParticipation[]
}

export default function ParticipantDashboard({ user, raceParticipations }: ParticipantDashboardProps) {
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await participantSignout()
  }

  const formatElapsedTime = (startTime: string, finishTime: string) => {
    const start = new Date(startTime).getTime()
    const finish = new Date(finishTime).getTime()
    const elapsed = finish - start

    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const upcomingRaces = raceParticipations.filter(rp => !rp.finish_time && new Date(rp.race.race_date) >= new Date())
  const completedRaces = raceParticipations.filter(rp => rp.finish_time)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Signed in as {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600">Total Races</p>
            <p className="text-3xl font-bold text-gray-900">{raceParticipations.length}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedRaces.length}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-3xl font-bold text-blue-600">{upcomingRaces.length}</p>
          </div>
        </div>

        {/* Upcoming Races */}
        {upcomingRaces.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Upcoming Races</h2>
            <div className="space-y-4">
              {upcomingRaces.map((rp) => (
                <div key={rp.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rp.race.name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(rp.race.race_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="rounded-md bg-blue-100 px-4 py-2">
                        <p className="text-xs text-blue-600">Your Bib Number</p>
                        <p className="text-2xl font-bold text-blue-900">#{rp.bib_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Races */}
        {completedRaces.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Race Results</h2>
            <div className="space-y-4">
              {completedRaces.map((rp) => {
                const finishTime = rp.finish_time?.adjusted_time || rp.finish_time?.finish_time
                const elapsedTime = rp.race.start_time && finishTime
                  ? formatElapsedTime(rp.race.start_time, finishTime)
                  : 'N/A'

                return (
                  <div key={rp.id} className="rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{rp.race.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(rp.race.race_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          Bib #{rp.bib_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Finish Time</p>
                        <p className="text-3xl font-bold text-gray-900 font-mono">{elapsedTime}</p>
                        {finishTime && (
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(finishTime).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {raceParticipations.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-lg text-gray-600 mb-4">You haven't registered for any races yet.</p>
            <a
              href="/register"
              className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Register for a Race
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
