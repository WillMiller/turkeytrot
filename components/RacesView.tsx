'use client'

import { useEffect, useState } from 'react'
import { getRaces, deleteRace } from '@/app/actions/races'
import type { Race } from '@/lib/types/database'
import RaceForm from './RaceForm'
import RaceDetail from './RaceDetail'

export default function RacesView() {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRace, setEditingRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRaces()
  }, [])

  const loadRaces = async () => {
    setLoading(true)
    const data = await getRaces()
    setRaces(data)
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingRace(null)
    setShowForm(true)
  }

  const handleEdit = (race: Race) => {
    setEditingRace(race)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingRace(null)
    loadRaces()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this race? This will also delete all associated racers and finish times.')) {
      return
    }

    const result = await deleteRace(id)
    if (result.success) {
      if (selectedRace?.id === id) {
        setSelectedRace(null)
      }
      loadRaces()
    } else if (result.error) {
      alert(result.error)
    }
  }

  const handleSelectRace = (race: Race) => {
    setSelectedRace(race)
  }

  const handleBackToList = () => {
    setSelectedRace(null)
    loadRaces()
  }

  if (selectedRace) {
    return <RaceDetail race={selectedRace} onBack={handleBackToList} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Races</h2>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Race
        </button>
      </div>

      {showForm && (
        <RaceForm
          race={editingRace}
          onClose={handleFormClose}
        />
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : races.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No races yet. Click &quot;Create Race&quot; to get started.
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {races.map((race) => (
              <li key={race.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {race.name}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        {new Date(race.race_date).toLocaleDateString()}
                      </span>
                      {race.start_time && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                          Started
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectRace(race)}
                      className="rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleEdit(race)}
                      className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(race.id)}
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
