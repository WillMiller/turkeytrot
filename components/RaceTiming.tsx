'use client'

import { useState, useRef, useEffect } from 'react'
import { recordFinishTime, recordMultipleFinishTimes, updateFinishTime, deleteFinishTime } from '@/app/actions/races'
import type { Race } from '@/lib/types/database'

interface RaceTimingProps {
  race: Race
  raceParticipants: any[]
  onUpdate: () => void
}

interface PendingFinish {
  bibNumber: number
  finishTime: string
  status: 'pending' | 'synced' | 'error'
  error?: string
}

export default function RaceTiming({ race, raceParticipants, onUpdate }: RaceTimingProps) {
  const [bibInput, setBibInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [pendingFinishes, setPendingFinishes] = useState<PendingFinish[]>([])
  const [editingFinish, setEditingFinish] = useState<{id: string, bibNumber: number, finishTime: string} | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const finishedCount = raceParticipants.filter(rp => rp.finish_time).length
  const stillRacing = raceParticipants.filter(rp => !rp.finish_time)

  // Load pending finishes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`race-${race.id}-pending`)
    if (stored) {
      try {
        setPendingFinishes(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored finishes:', e)
      }
    }
  }, [race.id])

  // Save pending finishes to localStorage
  useEffect(() => {
    if (pendingFinishes.length > 0) {
      localStorage.setItem(`race-${race.id}-pending`, JSON.stringify(pendingFinishes))
    } else {
      localStorage.removeItem(`race-${race.id}-pending`)
    }
  }, [pendingFinishes, race.id])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync pending finishes when online
  useEffect(() => {
    if (isOnline && pendingFinishes.filter(pf => pf.status === 'pending').length > 0) {
      syncPendingFinishes()
    }
  }, [isOnline])

  // Auto-focus the input
  useEffect(() => {
    inputRef.current?.focus()
  }, [finishedCount])

  const syncPendingFinishes = async () => {
    const pending = pendingFinishes.filter(pf => pf.status === 'pending')
    if (pending.length === 0) return

    for (const finish of pending) {
      try {
        const result = await recordFinishTime(race.id, finish.bibNumber, finish.finishTime)
        if (result?.error) {
          setPendingFinishes(prev =>
            prev.map(pf =>
              pf.bibNumber === finish.bibNumber && pf.finishTime === finish.finishTime
                ? { ...pf, status: 'error', error: result.error }
                : pf
            )
          )
        } else {
          setPendingFinishes(prev =>
            prev.map(pf =>
              pf.bibNumber === finish.bibNumber && pf.finishTime === finish.finishTime
                ? { ...pf, status: 'synced' }
                : pf
            )
          )
        }
      } catch (e) {
        console.error('Sync error:', e)
      }
    }

    // Remove synced entries after a delay
    setTimeout(() => {
      setPendingFinishes(prev => prev.filter(pf => pf.status !== 'synced'))
      onUpdate()
    }, 2000)
  }

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

    const finishTime = new Date().toISOString()

    // Add to pending queue immediately (optimistic UI)
    const newPending: PendingFinish[] = bibNumbers.map(bibNumber => ({
      bibNumber,
      finishTime,
      status: 'pending' as const
    }))

    setPendingFinishes(prev => [...prev, ...newPending])
    setSuccess(`Recorded ${bibNumbers.length} bib${bibNumbers.length > 1 ? 's' : ''}! ${!isOnline ? '(Offline - will sync when connected)' : ''}`)
    setBibInput('')
    setProcessing(false)
    inputRef.current?.focus()

    // Clear success message after 2 seconds
    setTimeout(() => setSuccess(null), 2000)

    // Try to sync immediately if online
    if (isOnline) {
      if (bibNumbers.length === 1) {
        const result = await recordFinishTime(race.id, bibNumbers[0], finishTime)

        if (result?.error) {
          setPendingFinishes(prev =>
            prev.map(pf =>
              pf.bibNumber === bibNumbers[0] && pf.finishTime === finishTime
                ? { ...pf, status: 'error', error: result.error }
                : pf
            )
          )
          setError(result.error)
        } else {
          setPendingFinishes(prev => prev.filter(pf => pf.bibNumber !== bibNumbers[0] || pf.finishTime !== finishTime))
          setTimeout(() => onUpdate(), 0)
        }
      } else {
        const result = await recordMultipleFinishTimes(race.id, bibNumbers, finishTime)

        if (result.errors && result.errors.length > 0) {
          setError(result.errors.map(e => e.error).join(', '))
        }

        if (result.success) {
          setPendingFinishes(prev => prev.filter(pf => !bibNumbers.includes(pf.bibNumber) || pf.finishTime !== finishTime))
          setTimeout(() => onUpdate(), 0)
        }
      }
    }
  }

  const handleEdit = (rp: any) => {
    const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
    setEditingFinish({
      id: rp.finish_time.id,
      bibNumber: rp.bib_number,
      finishTime: new Date(finishTime).toISOString().slice(0, 19)
    })
  }

  const handleSaveEdit = async () => {
    if (!editingFinish) return

    const result = await updateFinishTime(editingFinish.id, new Date(editingFinish.finishTime).toISOString())

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(`Updated bib #${editingFinish.bibNumber}`)
      setEditingFinish(null)
      setTimeout(() => {
        onUpdate()
        setSuccess(null)
      }, 1000)
    }
  }

  const handleDelete = async (finishTimeId: string, bibNumber: number) => {
    if (!confirm(`Delete finish time for bib #${bibNumber}?`)) return

    const result = await deleteFinishTime(finishTimeId)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(`Deleted finish time for bib #${bibNumber}`)
      setTimeout(() => {
        onUpdate()
        setSuccess(null)
      }, 1000)
    }
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
          {/* Connection Status */}
          {!isOnline && (
            <div className="rounded-md bg-orange-50 border border-orange-200 p-4">
              <p className="text-sm text-orange-800 font-semibold">
                ⚠️ Offline Mode - Times will sync automatically when connection is restored
              </p>
            </div>
          )}

          {/* Pending Syncs */}
          {pendingFinishes.filter(pf => pf.status === 'pending').length > 0 && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                📝 {pendingFinishes.filter(pf => pf.status === 'pending').length} finish time(s) pending sync...
              </p>
            </div>
          )}

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
              <p className="text-2xl font-bold text-orange-900">{stillRacing.length}</p>
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

          {/* Still Racing */}
          {stillRacing.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Still Racing ({stillRacing.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stillRacing.map((rp) => (
                  <div key={rp.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="rounded-md bg-orange-100 px-2 py-1 text-sm font-bold text-orange-700">
                      #{rp.bib_number}
                    </span>
                    <span className="text-sm text-gray-700 truncate">
                      {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Finishes */}
          {recentFinishes.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Finishes (Last 10)</h3>
              <div className="space-y-2">
                {recentFinishes.map((rp, index) => {
                  const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
                  const isEditing = editingFinish?.id === rp.finish_time.id

                  return (
                    <div key={rp.id} className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                          Bib #{rp.bib_number}
                        </span>
                        <span className="font-medium text-gray-900">
                          {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="datetime-local"
                              value={editingFinish.finishTime}
                              onChange={(e) => setEditingFinish({ ...editingFinish, finishTime: e.target.value })}
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFinish(null)}
                              className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="text-right">
                              <div className="font-mono text-lg font-bold text-gray-900">
                                {formatElapsedTime(race.start_time!, finishTime)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(finishTime).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(rp)}
                                className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700 hover:bg-yellow-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(rp.finish_time.id, rp.bib_number)}
                                className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
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
