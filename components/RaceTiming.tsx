'use client'

import { useState, useRef, useEffect } from 'react'
import { recordFinishTime, recordMultipleFinishTimes, updateFinishTime, deleteFinishTime, getRaceParticipants } from '@/app/actions/races'
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
  const [searchStillRacing, setSearchStillRacing] = useState('')
  const [searchFinished, setSearchFinished] = useState('')
  const [raceElapsed, setRaceElapsed] = useState('')
  const [localParticipants, setLocalParticipants] = useState(raceParticipants)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync local participants with prop changes (only when prop actually changes)
  useEffect(() => {
    setLocalParticipants(raceParticipants)
  }, [raceParticipants])

  // Background refresh without flickering
  const refreshDataInBackground = async () => {
    const freshData = await getRaceParticipants(race.id)
    setLocalParticipants(freshData)
  }

  const finishedCount = localParticipants.filter(rp => rp.finish_time).length
  const stillRacing = localParticipants
    .filter(rp => !rp.finish_time)
    .filter(rp => {
      if (!searchStillRacing) return true
      const search = searchStillRacing.toLowerCase()
      return (
        rp.bib_number?.toString().includes(search) ||
        rp.participant?.first_name?.toLowerCase().includes(search) ||
        rp.participant?.last_name?.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => (a.bib_number || 0) - (b.bib_number || 0))

  const finishedRacers = localParticipants
    .filter(rp => rp.finish_time)
    .filter(rp => {
      if (!searchFinished) return true
      const search = searchFinished.toLowerCase()
      return (
        rp.bib_number?.toString().includes(search) ||
        rp.participant?.first_name?.toLowerCase().includes(search) ||
        rp.participant?.last_name?.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => {
      const timeA = new Date(a.finish_time.adjusted_time || a.finish_time.finish_time).getTime()
      const timeB = new Date(b.finish_time.adjusted_time || b.finish_time.finish_time).getTime()
      return timeA - timeB
    })

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  // Auto-focus the input
  useEffect(() => {
    inputRef.current?.focus()
  }, [finishedCount])

  // Race clock - update every second
  useEffect(() => {
    if (!race.start_time) return

    const updateClock = () => {
      const start = new Date(race.start_time!).getTime()
      const now = Date.now()
      const elapsed = now - start

      const hours = Math.floor(elapsed / (1000 * 60 * 60))
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

      setRaceElapsed(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateClock() // Initial update
    const interval = setInterval(updateClock, 1000) // Update every second

    return () => clearInterval(interval)
  }, [race.start_time])

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

    setTimeout(() => {
      setPendingFinishes(prev => prev.filter(pf => pf.status !== 'synced'))
      refreshDataInBackground()
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

    const newPending: PendingFinish[] = bibNumbers.map(bibNumber => ({
      bibNumber,
      finishTime,
      status: 'pending' as const
    }))

    setPendingFinishes(prev => [...prev, ...newPending])
    setSuccess(`✓ ${bibNumbers.length} bib${bibNumbers.length > 1 ? 's' : ''}`)
    setBibInput('')
    setProcessing(false)
    inputRef.current?.focus()

    setTimeout(() => setSuccess(null), 1500)

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
          refreshDataInBackground()
        }
      } else {
        const result = await recordMultipleFinishTimes(race.id, bibNumbers, finishTime)

        if (result.errors && result.errors.length > 0) {
          setError(result.errors.map(e => e.error).join(', '))
        }

        if (result.success) {
          setPendingFinishes(prev => prev.filter(pf => !bibNumbers.includes(pf.bibNumber) || pf.finishTime !== finishTime))
          refreshDataInBackground()
        }
      }
    }
  }

  const handleEdit = (rp: any) => {
    const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
    // Format for datetime-local input: YYYY-MM-DDTHH:mm:ss (local time)
    const date = new Date(finishTime)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

    setEditingFinish({
      id: rp.finish_time.id,
      bibNumber: rp.bib_number,
      finishTime: formatted
    })
  }

  const handleSaveEdit = async () => {
    if (!editingFinish) return

    const result = await updateFinishTime(editingFinish.id, new Date(editingFinish.finishTime).toISOString())

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(`✓ Updated #${editingFinish.bibNumber}`)
      setEditingFinish(null)
      refreshDataInBackground()
      setTimeout(() => {
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
      setSuccess(`✓ Deleted #${bibNumber}`)
      refreshDataInBackground()
      setTimeout(() => {
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRacePosition = (rp: any) => {
    return finishedRacers.findIndex(r => r.id === rp.id) + 1
  }

  if (!race.start_time) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Race has not been started yet. Go to the race detail page and click &quot;Start Race&quot; to begin timing.
        </p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-3">
      {/* Top Bar - Status & Entry */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              {/* Race Clock */}
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono font-bold text-blue-900 text-base">{raceElapsed}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-gray-900">{localParticipants.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Finished:</span>
                <span className="font-bold text-green-600">{finishedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Racing:</span>
                <span className="font-bold text-orange-600">{stillRacing.length}</span>
              </div>
              {pendingFinishes.filter(pf => pf.status === 'pending').length > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 rounded border border-yellow-200">
                  <span className="text-xs text-yellow-700">Pending:</span>
                  <span className="text-xs font-bold text-yellow-900">{pendingFinishes.filter(pf => pf.status === 'pending').length}</span>
                </div>
              )}
            </div>

            {/* Online Status */}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-xs text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Entry Form */}
        <div className="p-3">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={bibInput}
                onChange={(e) => setBibInput(e.target.value)}
                disabled={processing}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-mono font-bold text-center text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter bib #"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={processing || !bibInput.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Record
            </button>
          </form>

          {/* Messages */}
          {(error || success) && (
            <div className="mt-2">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                  {success}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Split Panes */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* Left: Still Racing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Still Racing ({stillRacing.length})</h3>
            </div>
            <input
              type="text"
              value={searchStillRacing}
              onChange={(e) => setSearchStillRacing(e.target.value)}
              placeholder="Search bib or name..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-700">Bib</th>
                  <th className="text-left p-2 font-medium text-gray-700">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stillRacing.map((rp) => (
                  <tr key={rp.id} className="hover:bg-gray-50">
                    <td className="p-2">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-orange-100 text-orange-700 font-bold rounded text-xs">
                        #{rp.bib_number}
                      </span>
                    </td>
                    <td className="p-2 text-gray-900">
                      {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stillRacing.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                {searchStillRacing ? 'No matching racers' : 'All racers have finished!'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Finished */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Finished ({finishedCount})</h3>
            </div>
            <input
              type="text"
              value={searchFinished}
              onChange={(e) => setSearchFinished(e.target.value)}
              placeholder="Search bib or name..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-700 w-12">#</th>
                  <th className="text-left p-2 font-medium text-gray-700">Bib</th>
                  <th className="text-left p-2 font-medium text-gray-700">Name</th>
                  <th className="text-right p-2 font-medium text-gray-700">Time</th>
                  <th className="text-right p-2 font-medium text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {finishedRacers.map((rp) => {
                  const finishTime = rp.finish_time.adjusted_time || rp.finish_time.finish_time
                  const isEditing = editingFinish?.id === rp.finish_time.id
                  const position = getRacePosition(rp)

                  return (
                    <tr key={rp.id} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-500 font-medium">{position}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-green-100 text-green-700 font-bold rounded text-xs">
                          #{rp.bib_number}
                        </span>
                      </td>
                      <td className="p-2 text-gray-900">
                        {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                      </td>
                      <td className="p-2 text-right">
                        {isEditing && editingFinish ? (
                          <input
                            type="datetime-local"
                            value={editingFinish.finishTime}
                            onChange={(e) => setEditingFinish({ ...editingFinish, finishTime: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        ) : (
                          <div>
                            <div className="font-mono font-bold text-gray-900">
                              {formatElapsedTime(race.start_time!, finishTime)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(finishTime)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {isEditing && editingFinish ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={handleSaveEdit}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFinish(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleEdit(rp)}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                              title="Edit time"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(rp.finish_time.id, rp.bib_number)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {finishedRacers.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                {searchFinished ? 'No matching finishers' : 'No finishers yet'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
