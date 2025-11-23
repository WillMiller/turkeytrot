'use client'

import { useState, useEffect } from 'react'
import { getParticipants, updateParticipant } from '@/app/actions/participants'
import { addParticipantToRace, removeParticipantFromRace, updateBibNumber } from '@/app/actions/races'
import type { Race, Participant } from '@/lib/types/database'

interface ParticipantManagerProps {
  race: Race
  raceParticipants: any[]
  onUpdate: () => void
}

export default function ParticipantManager({ race, raceParticipants, onUpdate }: ParticipantManagerProps) {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<string>('')
  const [bibNumber, setBibNumber] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingBib, setEditingBib] = useState<{ id: string; number: number } | null>(null)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [localRaceParticipants, setLocalRaceParticipants] = useState(raceParticipants)

  useEffect(() => {
    loadAllParticipants()
  }, [])

  useEffect(() => {
    setLocalRaceParticipants(raceParticipants)
  }, [raceParticipants])

  const loadAllParticipants = async () => {
    const data = await getParticipants()
    setAllParticipants(data)
  }

  const availableParticipants = allParticipants.filter(
    p => !raceParticipants.some(rp => rp.participant_id === p.id)
  )

  // Check for missing participant fields
  const getMissingFields = (participant: Participant): string[] => {
    const missing: string[] = []
    if (!participant.gender) missing.push('Gender')
    if (!participant.date_of_birth) missing.push('Date of Birth')
    if (!participant.emergency_contact_name) missing.push('Emergency Contact Name')
    if (!participant.emergency_contact_phone) missing.push('Emergency Contact Phone')
    return missing
  }

  const selectedParticipantData = allParticipants.find(p => p.id === selectedParticipant)
  const missingFields = selectedParticipantData ? getMissingFields(selectedParticipantData) : []

  const handleAddParticipant = async () => {
    if (!selectedParticipant || !bibNumber) {
      setError('Please select a participant and enter a bib number')
      return
    }

    setLoading(true)
    setError(null)

    const result = await addParticipantToRace(race.id, selectedParticipant, parseInt(bibNumber))

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setShowAddModal(false)
      setSelectedParticipant('')
      setBibNumber('')
      onUpdate()
      setLoading(false)
    }
  }

  const handleRemoveParticipant = async (raceParticipantId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the race?')) {
      return
    }

    const result = await removeParticipantFromRace(raceParticipantId)
    if (result.success) {
      onUpdate()
    } else if (result.error) {
      alert(result.error)
    }
  }

  const handleUpdateBib = async (raceParticipantId: string, newBibNumber: number) => {
    // Optimistically update local state immediately
    const previousState = localRaceParticipants
    setLocalRaceParticipants(prev =>
      prev.map(rp => rp.id === raceParticipantId ? { ...rp, bib_number: newBibNumber } : rp)
    )
    setEditingBib(null)

    const result = await updateBibNumber(raceParticipantId, newBibNumber, race.id)
    if (result.error) {
      alert(result.error)
      // Revert on error
      setLocalRaceParticipants(previousState)
    }
    // Don't call onUpdate() to prevent page refresh - local state is already updated
  }

  const handleAutoAssignBibs = async () => {
    if (!confirm('Auto-assign bib numbers to all participants without bibs? This will assign sequential numbers starting from the next available number.')) {
      return
    }

    setLoading(true)

    // Find the highest current bib number
    const highestBib = Math.max(0, ...localRaceParticipants.map(rp => rp.bib_number || 0))
    let nextBibNumber = highestBib + 1

    // Get participants without bib numbers, sorted alphabetically
    const participantsWithoutBibs = localRaceParticipants
      .filter(rp => !rp.bib_number)
      .sort((a, b) => {
        const nameA = `${a.participant.last_name || ''} ${a.participant.first_name || ''}`.toLowerCase()
        const nameB = `${b.participant.last_name || ''} ${b.participant.first_name || ''}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })

    // Assign bib numbers sequentially
    for (const rp of participantsWithoutBibs) {
      const result = await updateBibNumber(rp.id, nextBibNumber, race.id)
      if (!result.error) {
        // Update local state
        setLocalRaceParticipants(prev =>
          prev.map(p => p.id === rp.id ? { ...p, bib_number: nextBibNumber } : p)
        )
        nextBibNumber++
      }
    }

    setLoading(false)
  }

  const handleUpdateParticipantInfo = async () => {
    if (!editingParticipant) return

    setLoading(true)
    const formData = new FormData()
    formData.append('first_name', editingParticipant.first_name || '')
    formData.append('last_name', editingParticipant.last_name || '')
    formData.append('email', editingParticipant.email || '')
    formData.append('gender', editingParticipant.gender || '')
    formData.append('phone', editingParticipant.phone || '')
    formData.append('date_of_birth', editingParticipant.date_of_birth || '')
    formData.append('emergency_contact_name', editingParticipant.emergency_contact_name || '')
    formData.append('emergency_contact_phone', editingParticipant.emergency_contact_phone || '')

    const result = await updateParticipant(editingParticipant.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      await loadAllParticipants()
      setEditingParticipant(null)
      setLoading(false)
      // Refresh race participants to update the warning badge
      onUpdate()
    }
  }

  // Filter and sort participants
  const filteredParticipants = localRaceParticipants.filter(rp => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const name = `${rp.participant.first_name || ''} ${rp.participant.last_name || ''}`.toLowerCase()
    const email = (rp.participant.email || '').toLowerCase()
    const bib = (rp.bib_number || '').toString()
    return name.includes(search) || email.includes(search) || bib.includes(search)
  })

  // Split into with/without bib and sort alphabetically
  const withoutBib = filteredParticipants
    .filter(rp => !rp.bib_number)
    .sort((a, b) => {
      const nameA = `${a.participant.last_name || ''} ${a.participant.first_name || ''}`.toLowerCase()
      const nameB = `${b.participant.last_name || ''} ${b.participant.first_name || ''}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })

  const withBib = filteredParticipants
    .filter(rp => rp.bib_number)
    .sort((a, b) => {
      const nameA = `${a.participant.last_name || ''} ${a.participant.first_name || ''}`.toLowerCase()
      const nameB = `${b.participant.last_name || ''} ${b.participant.first_name || ''}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })

  const RacerItem = ({ rp }: { rp: any }) => (
    <li key={rp.id} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {editingBib?.id === rp.id && editingBib ? (
            <input
              type="number"
              value={editingBib.number === 0 ? '' : editingBib.number}
              onChange={(e) => setEditingBib({ id: rp.id, number: parseInt(e.target.value) || 0 })}
              onBlur={() => {
                if (editingBib && editingBib.number > 0) {
                  handleUpdateBib(rp.id, editingBib.number)
                } else {
                  setEditingBib(null)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingBib && editingBib.number > 0) {
                  handleUpdateBib(rp.id, editingBib.number)
                } else if (e.key === 'Escape') {
                  setEditingBib(null)
                }
              }}
              placeholder="#"
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm font-bold text-gray-900"
              autoFocus
            />
          ) : rp.bib_number ? (
            <button
              onClick={() => setEditingBib({ id: rp.id, number: rp.bib_number })}
              className="w-16 rounded-md bg-blue-100 px-2 py-1 text-center text-sm font-bold text-blue-700 hover:bg-blue-200"
            >
              #{rp.bib_number}
            </button>
          ) : (
            <button
              onClick={() => setEditingBib({ id: rp.id, number: 0 })}
              className="w-16 rounded-md bg-gray-100 px-2 py-1 text-center text-sm font-medium text-gray-500 hover:bg-gray-200"
            >
              Add #
            </button>
          )}
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
              {getMissingFields(rp.participant).length > 0 && (
                <button
                  onClick={() => setEditingParticipant(rp.participant)}
                  className="inline-flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
                  title={`Missing: ${getMissingFields(rp.participant).join(', ')}`}
                >
                  ⚠
                </button>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {rp.participant.gender && `${rp.participant.gender} • `}
              {rp.participant.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleRemoveParticipant(rp.id)}
          className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
        >
          Remove
        </button>
      </div>
    </li>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Race Participants ({localRaceParticipants.length})</h2>
        <div className="flex gap-3">
          {withoutBib.length > 0 && (
            <button
              onClick={handleAutoAssignBibs}
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : `Auto-Assign ${withoutBib.length} Bib#s`}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add Racer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search by name, email, or bib number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {localRaceParticipants.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No racers added to this race yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Without Bib Numbers Column */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
              <h3 className="font-semibold text-gray-900">Without Bib Numbers ({withoutBib.length})</h3>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {withoutBib.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  All racers have bib numbers assigned
                </li>
              ) : (
                withoutBib.map(rp => <RacerItem key={rp.id} rp={rp} />)
              )}
            </ul>
          </div>

          {/* With Bib Numbers Column */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
              <h3 className="font-semibold text-gray-900">With Bib Numbers ({withBib.length})</h3>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {withBib.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  No bib numbers assigned yet
                </li>
              ) : (
                withBib.map(rp => <RacerItem key={rp.id} rp={rp} />)
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">
                  Add Racer to Race
                </h3>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="participant" className="block text-sm font-medium text-gray-700">
                      Select Racer
                    </label>
                    <select
                      id="participant"
                      value={selectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Choose...</option>
                      {availableParticipants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {[p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed'} {p.email && `(${p.email})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bib_number" className="block text-sm font-medium text-gray-700">
                      Bib Number
                    </label>
                    <input
                      type="number"
                      id="bib_number"
                      value={bibNumber}
                      onChange={(e) => setBibNumber(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  {/* Missing Fields Warning */}
                  {missingFields.length > 0 && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <span className="text-yellow-600">⚠</span>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Missing Information
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>This participant is missing: {missingFields.join(', ')}</p>
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => selectedParticipantData && setEditingParticipant(selectedParticipantData)}
                              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                            >
                              Fill Missing Info
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={handleAddParticipant}
                  disabled={loading}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError(null)
                    setSelectedParticipant('')
                    setBibNumber('')
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Participant Info Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="edit-modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingParticipant(null)}></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4" id="edit-modal-title">
                  Complete Participant Information
                </h3>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      value={editingParticipant.gender || ''}
                      onChange={(e) => setEditingParticipant({ ...editingParticipant, gender: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Choose...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={editingParticipant.date_of_birth || ''}
                      onChange={(e) => setEditingParticipant({ ...editingParticipant, date_of_birth: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={editingParticipant.emergency_contact_name || ''}
                      onChange={(e) => setEditingParticipant({ ...editingParticipant, emergency_contact_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={editingParticipant.emergency_contact_phone || ''}
                      onChange={(e) => setEditingParticipant({ ...editingParticipant, emergency_contact_phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={handleUpdateParticipantInfo}
                  disabled={loading}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingParticipant(null)
                    setError(null)
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
