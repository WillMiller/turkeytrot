'use client'

import { useState, useEffect } from 'react'
import { getRaceParticipants } from '@/app/actions/races'

interface Race {
  id: string
  name: string
  race_date: string
  start_time: string | null
}

interface ParticipantRaceResultsProps {
  races: Race[]
}

type CategoryType = 'overall' | 'gender' | 'age' | 'gender-age'

interface AgeCategory {
  name: string
  minAge: number
  maxAge: number
}

const AGE_CATEGORIES: AgeCategory[] = [
  { name: 'Youth (Under 18)', minAge: 0, maxAge: 17 },
  { name: 'Adult (18-29)', minAge: 18, maxAge: 29 },
  { name: 'Masters (30-39)', minAge: 30, maxAge: 39 },
  { name: 'Veterans (40-49)', minAge: 40, maxAge: 49 },
  { name: 'Seniors (50-59)', minAge: 50, maxAge: 59 },
  { name: 'Super Seniors (60+)', minAge: 60, maxAge: 999 },
]

export default function ParticipantRaceResults({ races }: ParticipantRaceResultsProps) {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [raceParticipants, setRaceParticipants] = useState<any[]>([])
  const [categoryType, setCategoryType] = useState<CategoryType>('overall')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Load race participants when race is selected
  useEffect(() => {
    if (selectedRace) {
      const loadParticipants = async () => {
        setLoading(true)
        const data = await getRaceParticipants(selectedRace.id)
        setRaceParticipants(data)
        setLoading(false)
      }
      loadParticipants()
    }
  }, [selectedRace])

  const calculateAge = (dateOfBirth: string, raceDate: string) => {
    const dob = new Date(dateOfBirth)
    const race = new Date(raceDate)
    let age = race.getFullYear() - dob.getFullYear()
    const monthDiff = race.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && race.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  const getAgeCategory = (age: number): string => {
    const category = AGE_CATEGORIES.find(cat => age >= cat.minAge && age <= cat.maxAge)
    return category?.name || 'Unassigned'
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

  if (!selectedRace) {
    // Filter races to only show those with results
    const racesWithResults = races.filter(race => race.start_time)

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Race Results</h2>
        {racesWithResults.length === 0 ? (
          <p className="text-gray-600">No race results available yet.</p>
        ) : (
          <>
            <p className="text-gray-600">Select a race to view results:</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {racesWithResults.map((race) => (
                <button
                  key={race.id}
                  onClick={() => setSelectedRace(race)}
                  className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{race.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(race.race_date).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Filter and categorize results
  const finishedRacers = raceParticipants.filter(rp => rp.finish_time && selectedRace?.start_time)

  let results: any[] = []

  if (categoryType === 'overall') {
    results = [...finishedRacers].sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeA - timeB
    })
  } else if (categoryType === 'gender') {
    const male = finishedRacers.filter(rp => rp.participant.gender?.toLowerCase() === 'male')
    const female = finishedRacers.filter(rp => rp.participant.gender?.toLowerCase() === 'female')
    results = [...male, ...female].sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeA - timeB
    })
  } else if (categoryType === 'age') {
    results = [...finishedRacers].sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeA - timeB
    })
  } else if (categoryType === 'gender-age') {
    results = [...finishedRacers].sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeA - timeB
    })
  }

  // Apply search filter
  const filteredResults = results.filter(rp => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    const name = [rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ').toLowerCase()
    return name.includes(search) || rp.bib_number?.toString().includes(search)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setSelectedRace(null)}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2"
          >
            ← Back to races
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{selectedRace.name}</h2>
          <p className="text-sm text-gray-600">
            {new Date(selectedRace.race_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or bib number..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value as CategoryType)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="overall">Overall</option>
            <option value="gender">By Gender</option>
            <option value="age">By Age</option>
            <option value="gender-age">By Gender & Age</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Place</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Name</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Bib</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Finish Time</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Race Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Loading results...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No matching results found' : 'No results available yet'}
                  </td>
                </tr>
              ) : (
                filteredResults.map((rp, index) => {
                  const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
                  const elapsed = formatElapsedTime(selectedRace.start_time!, finishTime)
                  const clockTime = new Date(finishTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })

                  return (
                    <tr
                      key={rp.id}
                      className={`hover:bg-gray-50 ${
                        index === 0
                          ? 'bg-yellow-50'
                          : index === 1
                          ? 'bg-gray-50'
                          : index === 2
                          ? 'bg-orange-50'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? 'text-yellow-600'
                                : index === 1
                                ? 'text-gray-600'
                                : index === 2
                                ? 'text-orange-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {index + 1}
                          </span>
                          {index < 3 && (
                            <span className="text-base">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold text-sm">
                          #{rp.bib_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-700 font-mono">
                          {clockTime}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-lg font-mono font-bold text-blue-600">
                          {elapsed}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredResults.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          Showing {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
        </p>
      )}
    </div>
  )
}
