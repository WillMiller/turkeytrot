'use client'

import { useState, useRef, useEffect } from 'react'
import { recordFinishTime, recordMultipleFinishTimes } from '@/app/actions/races'
import type { Race } from '@/lib/types/database'

interface RaceTimingProps {
  race: Race
  raceParticipants: any[]
  onUpdate: () => void
}

export default function RaceTiming({ race, raceParticipants, onUpdate }: RaceTimingProps) {
  const [bibInput, setBibInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const finishedCount = raceParticipants.filter(rp => rp.finish_time).length

  useEffect(() => {
    console.log('RaceTiming - raceParticipants:', raceParticipants)
    console.log('RaceTiming - finishedCount:', finishedCount)
    // Auto-focus the input on mount and after each successful entry
    inputRef.current?.focus()
  }, [finishedCount, raceParticipants])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bibInput.trim() || processing) {
      return
    }

    if (!race.start_time) {
      setError('Race has not been started yet')
      return
    }

    setError(null)
    setSuccess(null)
    setProcessing(true)

    // Parse space-separated bib numbers
    const bibNumbersInput = bibInput.trim().split(/\s+/)
    const bibNumbers = bibNumbersInput.map(b => parseInt(b)).filter(b => !isNaN(b))

    if (bibNumbers.length === 0) {
      setError('Invalid bib number(s)')
      setBibInput('')
      setProcessing(false)
      inputRef.current?.focus()
      return
    }

    // Handle single or multiple bib numbers
    if (bibNumbers.length === 1) {
      const result = await recordFinishTime(race.id, bibNumbers[0])

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`Bib #${bibNumbers[0]} recorded!`)
        // Update immediately without waiting
        setTimeout(() => onUpdate(), 0)
      }
    } else {
      const result = await recordMultipleFinishTimes(race.id, bibNumbers)

      if (result.errors && result.errors.length > 0) {
        setError(result.errors.map(e => e.error).join(', '))
      }

      if (result.success) {
        setSuccess(result.message || `Recorded ${bibNumbers.length} bibs!`)
        // Update immediately without waiting
        setTimeout(() => onUpdate(), 0)
      }
    }

    setBibInput('')
    setProcessing(false)
    inputRef.current?.focus()

    // Clear success message after 2 seconds
    setTimeout(() => setSuccess(null), 2000)
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

  const recentFinishes = raceParticipants
    .filter(rp => rp.finish_time)
    .sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeB - timeA
    })
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {!race.start_time ? (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Race has not been started yet. Go to the race detail page and click &quot;Start Race&quot; to begin timing.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Total Racers</p>
              <p className="text-2xl font-bold text-blue-900">{raceParticipants.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Finished</p>
              <p className="text-2xl font-bold text-green-900">{finishedCount}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm text-orange-600">Still Racing</p>
              <p className="text-2xl font-bold text-orange-900">{raceParticipants.length - finishedCount}</p>
            </div>
          </div>

          {/* Quick Entry Form */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Finish Time</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              <div>
                <label htmlFor="bib_input" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Bib Number(s) and Press Enter
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="bib_input"
                  value={bibInput}
                  onChange={(e) => setBibInput(e.target.value)}
                  disabled={processing}
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 text-2xl text-center font-bold text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-50"
                  placeholder="123 or 123 124 125"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter one bib number (e.g., <strong>123</strong>) or multiple space-separated bibs (e.g., <strong>123 124 125</strong>) for racers finishing at the same time. Press Enter to record.
                </p>
              </div>
            </form>
          </div>

          {/* Recent Finishes */}
          {recentFinishes.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Finishes</h3>
              <div className="space-y-2">
                {recentFinishes.map((rp, index) => {
                  const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
                  return (
                    <div key={rp.id} className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                          Bib #{rp.bib_number}
                        </span>
                        <span className="font-medium text-gray-900">
                          {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-gray-900">
                          {formatElapsedTime(race.start_time!, finishTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(finishTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
