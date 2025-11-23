'use client'

import { useState, useEffect } from 'react'
import { createRace, updateRace, bulkAddParticipantsToRace } from '@/app/actions/races'
import { getParticipants } from '@/app/actions/participants'
import type { Race, Participant } from '@/lib/types/database'

interface RaceFormProps {
  race: Race | null
  onClose: () => void
}

type AddMethod = 'manual' | 'csv'

export default function RaceForm({ race, onClose }: RaceFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [addMethod, setAddMethod] = useState<AddMethod>('manual')
  const [csvText, setCsvText] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)

  useEffect(() => {
    // Load all participants
    const loadParticipants = async () => {
      const participants = await getParticipants()
      setAllParticipants(participants)
    }
    loadParticipants()
  }, [])

  const filteredParticipants = allParticipants.filter(p => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
    const email = (p.email || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || email.includes(search)
  })

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const emailIdx = header.findIndex(h => h.includes('email'))
    const firstNameIdx = header.findIndex(h => h.includes('first'))
    const lastNameIdx = header.findIndex(h => h.includes('last'))

    if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
      throw new Error('CSV must have Email, First Name, and Last Name columns')
    }

    const participants: Array<{email: string, firstName: string, lastName: string}> = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim())
      const email = values[emailIdx]
      const firstName = values[firstNameIdx]
      const lastName = values[lastNameIdx]

      if (email && firstName && lastName) {
        participants.push({ email, firstName, lastName })
      }
    }

    return participants
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      if (race) {
        // Updating existing race
        const result = await updateRace(race.id, formData)
        if (result.error) {
          setError(result.error)
          setLoading(false)
        } else {
          onClose()
        }
      } else {
        // Creating new race
        // Add selected participants to formData if using manual method
        if (addMethod === 'manual') {
          formData.set('participants', JSON.stringify(selectedParticipants))
        }

        const result = await createRace(formData)

        if (result.error) {
          setError(result.error)
          setLoading(false)
          return
        }

        // If using CSV method and race was created successfully, bulk add participants
        if (addMethod === 'csv' && result.success && result.raceId) {
          let csvData = csvText

          // If file was uploaded, read it
          if (csvFile) {
            csvData = await csvFile.text()
          }

          if (csvData) {
            const participants = parseCSV(csvData)
            if (participants.length > 0) {
              const bulkResult = await bulkAddParticipantsToRace(result.raceId, participants)
              if (bulkResult.errors && bulkResult.errors.length > 0) {
                setError(`Added ${bulkResult.success} participants. ${bulkResult.errors.length} errors: ${bulkResult.errors.slice(0, 3).join(', ')}${bulkResult.errors.length > 3 ? '...' : ''}`)
                setLoading(false)
                return
              }
            }
          }
        }

        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">
                {race ? 'Edit Race' : 'Create Race'}
              </h3>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Race Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    defaultValue={race?.name || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="race_date" className="block text-sm font-medium text-gray-700">
                    Race Date
                  </label>
                  <input
                    type="date"
                    name="race_date"
                    id="race_date"
                    required
                    defaultValue={race?.race_date || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                {!race && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Add Participants
                    </label>

                    {/* Tab Buttons */}
                    <div className="flex border-b border-gray-200 mb-4">
                      <button
                        type="button"
                        onClick={() => setAddMethod('manual')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${
                          addMethod === 'manual'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Select Manually
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMethod('csv')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${
                          addMethod === 'csv'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Upload CSV
                      </button>
                    </div>

                    {addMethod === 'manual' ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            {selectedParticipants.length} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedParticipants.length === filteredParticipants.length) {
                                setSelectedParticipants([])
                              } else {
                                setSelectedParticipants(filteredParticipants.map(p => p.id))
                              }
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {selectedParticipants.length === filteredParticipants.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Search participants..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                          {filteredParticipants.length === 0 ? (
                            <p className="p-4 text-sm text-gray-500 text-center">No participants found</p>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {filteredParticipants.map(participant => (
                                <label
                                  key={participant.id}
                                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedParticipants.includes(participant.id)}
                                    onChange={() => toggleParticipant(participant.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-3 text-sm text-gray-900">
                                    {[participant.first_name, participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                                    {participant.email && (
                                      <span className="ml-2 text-gray-500">({participant.email})</span>
                                    )}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
                          <p className="text-sm text-blue-800">
                            Upload a CSV with columns: <strong>Email, First Name, Last Name</strong>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Existing accounts will be added to the race. New accounts will be created automatically.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload CSV File
                          </label>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setCsvFile(file)
                                setCsvText('')
                              }
                            }}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paste CSV Data
                          </label>
                          <textarea
                            value={csvText}
                            onChange={(e) => {
                              setCsvText(e.target.value)
                              setCsvFile(null)
                            }}
                            placeholder="Email,First Name,Last Name&#10;john@example.com,John,Doe&#10;jane@example.com,Jane,Smith"
                            className="block w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {loading ? 'Saving...' : (race ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
