'use client'

import { useEffect, useState } from 'react'
import { getRaceParticipants, startRace } from '@/app/actions/races'
import type { Race } from '@/lib/types/database'
import ParticipantManager from './ParticipantManager'
import RaceTiming from './RaceTiming'
import RaceResults from './RaceResults'

interface RaceDetailProps {
  race: Race
  onBack: () => void
}

type Tab = 'participants' | 'timing' | 'results'

export default function RaceDetail({ race, onBack }: RaceDetailProps) {
  const [currentTab, setCurrentTab] = useState<Tab>('timing')
  const [raceParticipants, setRaceParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(!!race.start_time)

  useEffect(() => {
    loadRaceParticipants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRaceParticipants = async () => {
    setLoading(true)
    const data = await getRaceParticipants(race.id)
    console.log('Loaded race participants:', data)
    setRaceParticipants(data)
    setLoading(false)
  }

  const handleStartRace = async () => {
    if (!confirm('Are you sure you want to start the race? This will record the start time.')) {
      return
    }

    const result = await startRace(race.id)
    if (result.success) {
      setIsStarted(true)
      race.start_time = new Date().toISOString()
    } else if (result.error) {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{race.name}</h2>
            <p className="text-sm text-gray-600">
              {new Date(race.race_date).toLocaleDateString()}
              {isStarted && race.start_time && (
                <span className="ml-2 text-green-600">
                  • Started at {new Date(race.start_time).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        {!isStarted && (
          <button
            onClick={handleStartRace}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Start Race
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentTab('timing')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              currentTab === 'timing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Timing
          </button>
          <button
            onClick={() => setCurrentTab('participants')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              currentTab === 'participants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Racers ({raceParticipants.length})
          </button>
          <button
            onClick={() => setCurrentTab('results')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              currentTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Results
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {currentTab === 'participants' && (
            <ParticipantManager
              race={race}
              raceParticipants={raceParticipants}
              onUpdate={loadRaceParticipants}
            />
          )}
          {currentTab === 'timing' && (
            <RaceTiming
              race={race}
              raceParticipants={raceParticipants}
              onUpdate={loadRaceParticipants}
            />
          )}
          {currentTab === 'results' && (
            <RaceResults
              race={race}
              raceParticipants={raceParticipants}
              onUpdate={loadRaceParticipants}
            />
          )}
        </>
      )}
    </div>
  )
}
