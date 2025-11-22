'use client'

import { useEffect, useState } from 'react'
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '@/app/actions/participants'
import type { Participant } from '@/lib/types/database'
import ParticipantForm from './ParticipantForm'
import BulkParticipantUpload from './BulkParticipantUpload'

export default function ParticipantsView() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  useEffect(() => {
    loadParticipants()
  }, [])

  const loadParticipants = async () => {
    setLoading(true)
    const data = await getParticipants()
    setParticipants(data)
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingParticipant(null)
    setShowForm(true)
  }

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingParticipant(null)
    loadParticipants()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) {
      return
    }

    const result = await deleteParticipant(id)
    if (result.success) {
      loadParticipants()
    } else if (result.error) {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Racers</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Bulk Upload CSV
          </button>
          <button
            onClick={handleCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Racer
          </button>
        </div>
      </div>

      {showForm && (
        <ParticipantForm
          participant={editingParticipant}
          onClose={handleFormClose}
        />
      )}

      {showBulkUpload && (
        <BulkParticipantUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={loadParticipants}
        />
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No racers yet. Click &quot;Add Racer&quot; to get started.
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {participants.map((participant) => (
              <li key={participant.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {[participant.first_name, participant.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                      </h3>
                      {participant.gender && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {participant.gender}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                      {participant.email && <div>Email: {participant.email}</div>}
                      {participant.phone && <div>Phone: {participant.phone}</div>}
                      {participant.date_of_birth && <div>DOB: {new Date(participant.date_of_birth).toLocaleDateString()}</div>}
                      {participant.emergency_contact_name && (
                        <div>Emergency: {participant.emergency_contact_name} {participant.emergency_contact_phone && `(${participant.emergency_contact_phone})`}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(participant)}
                      className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(participant.id)}
                      className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
