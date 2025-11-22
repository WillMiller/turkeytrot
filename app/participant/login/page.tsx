'use client'

import { useState, useEffect } from 'react'
import { participantLogin } from '@/app/actions/participant-auth'
import { registerUser } from '@/app/actions/public'
import type { Race } from '@/lib/types/database'

export default function ParticipantLoginPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [races, setRaces] = useState<Race[]>([])
  const [loadingRaces, setLoadingRaces] = useState(true)
  const [selectedRaces, setSelectedRaces] = useState<string[]>([])

  // Load available upcoming races for signup
  useEffect(() => {
    if (isSignup) {
      fetch('/api/races')
        .then(res => res.json())
        .then(data => {
          const upcomingRaces = (data.races || []).filter((race: Race) =>
            new Date(race.race_date) >= new Date()
          )
          setRaces(upcomingRaces)
          setLoadingRaces(false)
        })
        .catch(() => {
          setLoadingRaces(false)
        })
    }
  }, [isSignup])

  const toggleRace = (raceId: string) => {
    setSelectedRaces(prev =>
      prev.includes(raceId)
        ? prev.filter(id => id !== raceId)
        : [...prev, raceId]
    )
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    if (isSignup) {
      // Validate password confirmation
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirm_password') as string

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Add selected races to formData
      formData.set('selected_races', JSON.stringify(selectedRaces))

      const result = await registerUser(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } else {
      const result = await participantLogin(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4">
      <div className={`w-full space-y-8 rounded-lg bg-white p-8 shadow-md ${isSignup ? 'max-w-2xl' : 'max-w-md'}`}>
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Racer Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignup ? 'Create your account' : 'Sign in to view your race results'}
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isSignup ? (
            // Signup Form with all fields
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    id="emergency_contact_name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    id="emergency_contact_phone"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    id="confirm_password"
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>

              {!loadingRaces && races.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Register for Upcoming Races (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Select which races you&apos;d like to register for. Bib numbers will be assigned on race day.
                  </p>
                  <div className="space-y-2">
                    {races.map(race => (
                      <label
                        key={race.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-md border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRaces.includes(race.id)}
                          onChange={() => toggleRace(race.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-900">
                          {race.name} - {new Date(race.race_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Login Form
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign in')}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setError(null)
                setSelectedRaces([])
              }}
              className="block w-full text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
            {!isSignup && (
              <a
                href="/reset-password"
                className="block text-sm text-gray-600 hover:text-gray-500"
              >
                Forgot your password?
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
