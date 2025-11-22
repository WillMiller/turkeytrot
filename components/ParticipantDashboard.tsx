'use client'

import { useState, useEffect } from 'react'
import { participantSignout } from '@/app/actions/participant-auth'
import { getAvailableRaces } from '@/app/actions/public'
import { registerForAdditionalRaces } from '@/app/actions/participant'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface RaceParticipation {
  id: string
  bib_number: number | null
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

interface Race {
  id: string
  name: string
  race_date: string
  start_time: string | null
}

interface ParticipantDashboardProps {
  user: User
  raceParticipations: RaceParticipation[]
}

export default function ParticipantDashboard({ user, raceParticipations }: ParticipantDashboardProps) {
  const [signingOut, setSigningOut] = useState(false)
  const [availableRaces, setAvailableRaces] = useState<Race[]>([])
  const [loadingRaces, setLoadingRaces] = useState(true)
  const [selectedRaces, setSelectedRaces] = useState<string[]>([])
  const [registering, setRegistering] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Load available races on mount
  useEffect(() => {
    const loadRaces = async () => {
      setLoadingRaces(true)
      const result = await getAvailableRaces()
      console.log('Available races result:', result)
      if (result.races) {
        // Filter out races the user is already registered for
        const registeredRaceIds = raceParticipations.map(rp => rp.race.id)
        const unregisteredRaces = result.races.filter(race => !registeredRaceIds.includes(race.id))
        console.log('Unregistered races:', unregisteredRaces)
        setAvailableRaces(unregisteredRaces)
      }
      setLoadingRaces(false)
    }
    loadRaces()
  }, [raceParticipations])

  const handleSignOut = async () => {
    setSigningOut(true)
    await participantSignout()
  }

  const handleRaceSelection = (raceId: string) => {
    setSelectedRaces(prev =>
      prev.includes(raceId)
        ? prev.filter(id => id !== raceId)
        : [...prev, raceId]
    )
  }

  const handleRegisterForRaces = async () => {
    if (selectedRaces.length === 0) {
      setRegistrationMessage({ type: 'error', text: 'Please select at least one race' })
      return
    }

    setRegistering(true)
    setRegistrationMessage(null)

    const result = await registerForAdditionalRaces(selectedRaces)

    if (result.error) {
      setRegistrationMessage({ type: 'error', text: result.error })
    } else {
      setRegistrationMessage({
        type: 'success',
        text: `Successfully registered for ${selectedRaces.length} race${selectedRaces.length > 1 ? 's' : ''}!`
      })
      setSelectedRaces([])

      // Refresh the page to show new registrations
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }

    setRegistering(false)
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
          <div className="flex gap-3">
            <Link
              href="/participant/settings"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
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

        {/* Manage Race Registrations */}
        <div className="mb-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Manage Race Registrations</h2>

            {registrationMessage && (
              <div className={`mb-4 rounded-md p-4 ${registrationMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-sm ${registrationMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {registrationMessage.text}
                </p>
              </div>
            )}

            {loadingRaces ? (
              <p className="text-gray-600">Loading available races...</p>
            ) : availableRaces.length > 0 ? (
              <>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Available Races</h3>
                <div className="space-y-3 mb-6">
                  {availableRaces.map((race) => (
                    <label
                      key={race.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedRaces.includes(race.id)}
                          onChange={() => handleRaceSelection(race.id)}
                          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">{race.name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(race.race_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleRegisterForRaces}
                  disabled={registering || selectedRaces.length === 0}
                  className="w-full rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? 'Registering...' : `Register for ${selectedRaces.length || 0} Race${selectedRaces.length !== 1 ? 's' : ''}`}
                </button>
              </>
            ) : (
              <p className="text-gray-600">
                {upcomingRaces.length > 0
                  ? "You're registered for all available races!"
                  : "No races available at this time. Check back later!"}
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Races */}
        {upcomingRaces.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">My Upcoming Races</h2>
            <div className="space-y-4">
              {upcomingRaces.map((rp) => (
                <div key={rp.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
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
                      {rp.bib_number ? (
                        <div className="rounded-md bg-blue-100 px-4 py-2">
                          <p className="text-xs text-blue-600">Your Bib Number</p>
                          <p className="text-2xl font-bold text-blue-900">#{rp.bib_number}</p>
                        </div>
                      ) : (
                        <div className="rounded-md bg-yellow-100 px-4 py-2">
                          <p className="text-xs text-yellow-700">Bib Number</p>
                          <p className="text-sm font-semibold text-yellow-900">Pending Assignment</p>
                        </div>
                      )}
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

        {/* Empty State - removed since race registration is now in "Manage Race Registrations" section above */}
      </div>
    </div>
  )
}
