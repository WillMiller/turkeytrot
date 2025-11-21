'use client'

import { useState, useMemo } from 'react'
import { updateFinishTime } from '@/app/actions/races'
import type { Race } from '@/lib/types/database'
import { calculatePlacements, formatElapsedTime } from '@/lib/utils/placements'

interface RaceResultsProps {
  race: Race
  raceParticipants: any[]
  onUpdate: () => void
}

type ViewMode = 'overall' | 'gender' | 'age'

export default function RaceResults({ race, raceParticipants, onUpdate }: RaceResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overall')
  const [editingFinish, setEditingFinish] = useState<{ id: string; time: string } | null>(null)

  const results = useMemo(() => {
    if (!race.start_time) return []
    return calculatePlacements(raceParticipants, race.start_time)
  }, [raceParticipants, race.start_time])

  const handleUpdateFinishTime = async (finishTimeId: string, newTime: string) => {
    const result = await updateFinishTime(finishTimeId, newTime)
    if (result.success) {
      setEditingFinish(null)
      onUpdate()
    } else if (result.error) {
      alert(result.error)
    }
  }

  const groupedResults = useMemo(() => {
    if (viewMode === 'overall') {
      return { 'Overall': results }
    } else if (viewMode === 'gender') {
      const groups: Record<string, typeof results> = {}
      ;['Male', 'Female', 'Other'].forEach(gender => {
        const filtered = results.filter(r => r.participant.gender === gender)
        if (filtered.length > 0) {
          groups[gender] = filtered
        }
      })
      return groups
    } else {
      const groups: Record<string, typeof results> = {}
      ;['0-12', '13-17', '18-29', '30-39', '40-49', '50-59', '60+'].forEach(ageGroup => {
        const filtered = results.filter(r => r.age_group === ageGroup)
        if (filtered.length > 0) {
          groups[ageGroup] = filtered
        }
      })
      return groups
    }
  }, [results, viewMode])

  if (!race.start_time) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Race has not been started yet. Results will be available once the race begins.
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-4">
        <p className="text-sm text-gray-800">
          No finishers yet. Use the Timing tab to record finish times.
        </p>
      </div>
    )
  }

  const getPlaceForMode = (result: typeof results[0]) => {
    if (viewMode === 'overall') return result.overall_place
    if (viewMode === 'gender') return result.gender_place
    return result.age_group_place
  }

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('overall')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            viewMode === 'overall'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overall
        </button>
        <button
          onClick={() => setViewMode('gender')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            viewMode === 'gender'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          By Gender
        </button>
        <button
          onClick={() => setViewMode('age')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            viewMode === 'age'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          By Age Group
        </button>
      </div>

      {/* Results Tables */}
      {Object.entries(groupedResults).map(([groupName, groupResults]) => (
        <div key={groupName} className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">{groupName}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Place
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Bib
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Age Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time
                  </th>
                  {viewMode === 'overall' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Gender Place
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Age Place
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {groupResults.map((result) => (
                  <tr key={result.race_participant_id} className={result.overall_place <= 3 && viewMode === 'overall' ? 'bg-yellow-50' : ''}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`text-lg font-bold ${
                        result.overall_place === 1 && viewMode === 'overall' ? 'text-yellow-600' :
                        result.overall_place === 2 && viewMode === 'overall' ? 'text-gray-400' :
                        result.overall_place === 3 && viewMode === 'overall' ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        #{getPlaceForMode(result)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-md bg-blue-100 px-2 py-1 text-sm font-bold text-blue-700">
                        {result.bib_number}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {[result.participant.first_name, result.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {result.participant.gender || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {result.age_group || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {editingFinish?.id === result.finish_time_id ? (
                        <input
                          type="datetime-local"
                          value={editingFinish.time}
                          onChange={(e) => setEditingFinish({ id: result.finish_time_id, time: e.target.value })}
                          onBlur={() => {
                            const newTime = new Date(editingFinish.time).toISOString()
                            handleUpdateFinishTime(result.finish_time_id, newTime)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newTime = new Date(editingFinish.time).toISOString()
                              handleUpdateFinishTime(result.finish_time_id, newTime)
                            } else if (e.key === 'Escape') {
                              setEditingFinish(null)
                            }
                          }}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            const datetime = new Date(result.finish_time).toISOString().slice(0, 16)
                            setEditingFinish({ id: result.finish_time_id, time: datetime })
                          }}
                          className="font-mono text-lg font-bold text-gray-900 hover:text-blue-600"
                        >
                          {formatElapsedTime(result.elapsed_time)}
                        </button>
                      )}
                    </td>
                    {viewMode === 'overall' && (
                      <>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {result.gender_place || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {result.age_group_place || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
