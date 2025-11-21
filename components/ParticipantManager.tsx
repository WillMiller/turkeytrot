'use client'

import { useState, useEffect } from 'react'
import { getParticipants } from '@/app/actions/participants'
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

  useEffect(() => {
    loadAllParticipants()
  }, [])

  const loadAllParticipants = async () => {
    const data = await getParticipants()
    setAllParticipants(data)
  }

  const availableParticipants = allParticipants.filter(
    p => !raceParticipants.some(rp => rp.participant_id === p.id)
  )

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
    const result = await updateBibNumber(raceParticipantId, newBibNumber, race.id)
    if (result.success) {
      setEditingBib(null)
      onUpdate()
    } else if (result.error) {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Race Participants</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Participant
        </button>
      </div>

      {raceParticipants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No participants added yet. Click &quot;Add Participant&quot; to get started.
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {raceParticipants.map((rp) => (
              <li key={rp.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {editingBib?.id === rp.id && editingBib ? (
                      <input
                        type="number"
                        value={editingBib.number}
                        onChange={(e) => setEditingBib({ id: rp.id, number: parseInt(e.target.value) })}
                        onBlur={() => editingBib && handleUpdateBib(rp.id, editingBib.number)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingBib) {
                            handleUpdateBib(rp.id, editingBib.number)
                          } else if (e.key === 'Escape') {
                            setEditingBib(null)
                          }
                        }}
                        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-center text-lg font-bold"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingBib({ id: rp.id, number: rp.bib_number })}
                        className="w-20 rounded-md bg-blue-100 px-3 py-2 text-center text-lg font-bold text-blue-700 hover:bg-blue-200"
                      >
                        #{rp.bib_number}
                      </button>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {[rp.participant.first_name, rp.participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {rp.participant.gender && `${rp.participant.gender} • `}
                        {rp.participant.email || rp.participant.phone}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveParticipant(rp.id)}
                    className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
                  Add Participant to Race
                </h3>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="participant" className="block text-sm font-medium text-gray-700">
                      Select Participant
                    </label>
                    <select
                      id="participant"
                      value={selectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
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
    </div>
  )
}
