'use client'

import { useState, useEffect } from 'react'
import { getRaces, getRaceParticipants } from '@/app/actions/races'
import type { Race } from '@/lib/types/database'

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

export default function RaceResultsDisplay() {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [raceParticipants, setRaceParticipants] = useState<any[]>([])
  const [categoryType, setCategoryType] = useState<CategoryType>('overall')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(3000) // milliseconds per item
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Load races on mount
  useEffect(() => {
    const loadRaces = async () => {
      const data = await getRaces()
      setRaces(data)
      setLoading(false)
    }
    loadRaces()
  }, [])

  // Load race participants when race is selected
  useEffect(() => {
    if (selectedRace) {
      const loadParticipants = async () => {
        const data = await getRaceParticipants(selectedRace.id)
        setRaceParticipants(data)
        setCurrentIndex(0)
      }
      loadParticipants()

      // Refresh every 10 seconds to get new finish times
      const interval = setInterval(loadParticipants, 10000)
      return () => clearInterval(interval)
    }
  }, [selectedRace])

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && categorizedResults.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % categorizedResults.length)
      }, scrollSpeed)
      return () => clearInterval(interval)
    }
  }, [autoScroll, scrollSpeed])

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

  // Filter and categorize results
  const finishedRacers = raceParticipants.filter(rp => rp.finish_time && selectedRace?.start_time)

  let categorizedResults: { category: string; results: any[] }[] = []

  if (categoryType === 'overall') {
    const sorted = [...finishedRacers].sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeA - timeB
    })
    categorizedResults = [{ category: 'Overall Results', results: sorted }]
  } else if (categoryType === 'gender') {
    const male = finishedRacers.filter(rp => rp.participant.gender?.toLowerCase() === 'male')
      .sort((a, b) => {
        const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
        const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
        return timeA - timeB
      })
    const female = finishedRacers.filter(rp => rp.participant.gender?.toLowerCase() === 'female')
      .sort((a, b) => {
        const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
        const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
        return timeA - timeB
      })
    const unassigned = finishedRacers.filter(rp => !rp.participant.gender ||
      (rp.participant.gender?.toLowerCase() !== 'male' && rp.participant.gender?.toLowerCase() !== 'female'))
      .sort((a, b) => {
        const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
        const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
        return timeA - timeB
      })

    if (male.length > 0) categorizedResults.push({ category: 'Male', results: male })
    if (female.length > 0) categorizedResults.push({ category: 'Female', results: female })
    if (unassigned.length > 0) categorizedResults.push({ category: 'Unassigned Gender', results: unassigned })
  } else if (categoryType === 'age') {
    const byAge: { [key: string]: any[] } = {}

    finishedRacers.forEach(rp => {
      if (rp.participant.date_of_birth && selectedRace) {
        const age = calculateAge(rp.participant.date_of_birth, selectedRace.race_date)
        const category = getAgeCategory(age)
        if (!byAge[category]) byAge[category] = []
        byAge[category].push(rp)
      } else {
        if (!byAge['Unassigned']) byAge['Unassigned'] = []
        byAge['Unassigned'].push(rp)
      }
    })

    // Sort each category by time
    Object.keys(byAge).forEach(cat => {
      byAge[cat].sort((a, b) => {
        const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
        const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
        return timeA - timeB
      })
    })

    // Add to results in age order
    AGE_CATEGORIES.forEach(cat => {
      if (byAge[cat.name] && byAge[cat.name].length > 0) {
        categorizedResults.push({ category: cat.name, results: byAge[cat.name] })
      }
    })
    if (byAge['Unassigned'] && byAge['Unassigned'].length > 0) {
      categorizedResults.push({ category: 'Unassigned Age', results: byAge['Unassigned'] })
    }
  } else if (categoryType === 'gender-age') {
    const byGenderAge: { [key: string]: any[] } = {}

    finishedRacers.forEach(rp => {
      const gender = rp.participant.gender?.toLowerCase() === 'male' ? 'Male' :
                     rp.participant.gender?.toLowerCase() === 'female' ? 'Female' : 'Unassigned Gender'

      let ageCategory = 'Unassigned Age'
      if (rp.participant.date_of_birth && selectedRace) {
        const age = calculateAge(rp.participant.date_of_birth, selectedRace.race_date)
        ageCategory = getAgeCategory(age)
      }

      const key = `${gender} - ${ageCategory}`
      if (!byGenderAge[key]) byGenderAge[key] = []
      byGenderAge[key].push(rp)
    })

    // Sort each category by time
    Object.keys(byGenderAge).forEach(cat => {
      byGenderAge[cat].sort((a, b) => {
        const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
        const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
        return timeA - timeB
      })
    })

    // Add to results
    const genders = ['Male', 'Female', 'Unassigned Gender']
    genders.forEach(gender => {
      AGE_CATEGORIES.forEach(ageCat => {
        const key = `${gender} - ${ageCat.name}`
        if (byGenderAge[key] && byGenderAge[key].length > 0) {
          categorizedResults.push({ category: key, results: byGenderAge[key] })
        }
      })
      const unassignedKey = `${gender} - Unassigned Age`
      if (byGenderAge[unassignedKey] && byGenderAge[unassignedKey].length > 0) {
        categorizedResults.push({ category: unassignedKey, results: byGenderAge[unassignedKey] })
      }
    })
  }

  if (loading) {
    return <div className="text-center py-8">Loading races...</div>
  }

  if (!selectedRace) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Race Results Display</h2>
        <p className="text-gray-600">Select a race to display results:</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <button
              key={race.id}
              onClick={() => setSelectedRace(race)}
              className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold text-gray-900">{race.name}</h3>
              <p className="text-sm text-gray-600">
                {new Date(race.race_date).toLocaleDateString()}
              </p>
              {race.start_time && (
                <p className="mt-2 text-xs text-green-600">
                  Started at {new Date(race.start_time).toLocaleTimeString()}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const currentCategory = categorizedResults[currentIndex]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Controls Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Race Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRace(null)}
                className="text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                ← Change
              </button>
              <div className="border-l border-gray-300 pl-3">
                <h2 className="text-base font-bold text-gray-900">{selectedRace.name}</h2>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or bib number..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Category Type */}
              <select
                value={categoryType}
                onChange={(e) => {
                  setCategoryType(e.target.value as CategoryType)
                  setCurrentIndex(0)
                }}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="overall">Overall</option>
                <option value="gender">By Gender</option>
                <option value="age">By Age</option>
                <option value="gender-age">Gender & Age</option>
              </select>

              {/* Speed Control - Always visible when multiple categories */}
              {categorizedResults.length > 1 && (
                <select
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={2000}>Fast</option>
                  <option value={3000}>Medium</option>
                  <option value={5000}>Slow</option>
                </select>
              )}

              {/* Auto Scroll Toggle */}
              {categorizedResults.length > 1 && (
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                    autoScroll
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {autoScroll ? '⏸ Pause' : '▶ Auto'}
                </button>
              )}

              {/* Manual Navigation */}
              {!autoScroll && categorizedResults.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + categorizedResults.length) % categorizedResults.length)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {currentIndex + 1}/{categorizedResults.length}
                  </span>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % categorizedResults.length)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Display - Spreadsheet Style */}
      <div className="flex-1 overflow-hidden p-6">
        {currentCategory ? (
          <div className="h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Category Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {currentCategory.category}
              </h2>
              <p className="text-sm opacity-90">
                {currentCategory.results.filter(rp => {
                  if (!searchQuery) return true
                  const search = searchQuery.toLowerCase()
                  const name = [rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ').toLowerCase()
                  return name.includes(search) || rp.bib_number?.toString().includes(search)
                }).length} {currentCategory.results.filter(rp => {
                  if (!searchQuery) return true
                  const search = searchQuery.toLowerCase()
                  const name = [rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ').toLowerCase()
                  return name.includes(search) || rp.bib_number?.toString().includes(search)
                }).length === 1 ? 'Result' : 'Results'}
              </p>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-lg border-b-2 border-gray-300">Place</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-lg border-b-2 border-gray-300">Name</th>
                    <th className="text-center py-4 px-6 font-bold text-gray-700 text-lg border-b-2 border-gray-300">Bib</th>
                    <th className="text-center py-4 px-6 font-bold text-gray-700 text-lg border-b-2 border-gray-300">Finish Time</th>
                    <th className="text-right py-4 px-6 font-bold text-gray-700 text-lg border-b-2 border-gray-300">Race Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCategory.results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500 text-xl">
                        No finishers in this category yet
                      </td>
                    </tr>
                  ) : (
                    currentCategory.results.filter(rp => {
                      if (!searchQuery) return true
                      const search = searchQuery.toLowerCase()
                      const name = [rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ').toLowerCase()
                      return name.includes(search) || rp.bib_number?.toString().includes(search)
                    }).map((rp, index) => {
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
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            index === 0
                              ? 'bg-yellow-50'
                              : index === 1
                              ? 'bg-gray-50'
                              : index === 2
                              ? 'bg-orange-50'
                              : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-2xl font-bold ${
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
                                <span className="text-xl">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-xl font-semibold text-gray-900">
                              {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-lg">
                              #{rp.bib_number}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-lg text-gray-700 font-mono">
                              {clockTime}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-2xl font-mono font-bold text-blue-600">
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
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-2xl">No results to display yet</p>
              <p className="mt-2">Waiting for finishers...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
