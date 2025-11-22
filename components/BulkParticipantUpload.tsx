'use client'

import { useState } from 'react'
import { bulkCreateParticipants } from '@/app/actions/participants'

interface ParsedParticipant {
  firstName: string
  lastName: string
  email: string
  gender?: string
}

export default function BulkParticipantUpload({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [csvText, setCsvText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedParticipant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    try {
      setError(null)
      const lines = text.trim().split('\n')
      if (lines.length === 0) {
        setError('CSV file is empty')
        return
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase())
      const firstNameIdx = header.findIndex(h => h.includes('first') || h === 'firstname')
      const lastNameIdx = header.findIndex(h => h.includes('last') || h === 'lastname')
      const emailIdx = header.findIndex(h => h.includes('email') || h === 'e-mail')
      const genderIdx = header.findIndex(h => h.includes('gender') || h === 'sex')

      if (firstNameIdx === -1 || lastNameIdx === -1 || emailIdx === -1) {
        setError('CSV must have columns: first name, last name, and email')
        return
      }

      // Parse data rows
      const participants: ParsedParticipant[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(',').map(v => v.trim())

        const firstName = values[firstNameIdx]
        const lastName = values[lastNameIdx]
        const email = values[emailIdx]
        const gender = genderIdx !== -1 ? values[genderIdx] : undefined

        if (!firstName || !lastName || !email) {
          continue // Skip incomplete rows
        }

        // Basic email validation
        if (!email.includes('@')) {
          continue // Skip invalid emails
        }

        participants.push({
          firstName,
          lastName,
          email,
          gender: gender && (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female')
            ? gender.toLowerCase() === 'male' ? 'Male' : 'Female'
            : undefined
        })
      }

      if (participants.length === 0) {
        setError('No valid participants found in CSV')
        return
      }

      setParsedData(participants)
    } catch (err) {
      setError('Failed to parse CSV. Please check the format.')
      console.error(err)
    }
  }

  const handleUpload = async () => {
    if (parsedData.length === 0) return

    setUploading(true)
    setError(null)

    const result = await bulkCreateParticipants(parsedData)

    if (result.error) {
      setError(result.error)
      setUploading(false)
    } else {
      setResult({
        success: result.success || 0,
        errors: result.errors || []
      })
      setUploading(false)

      if (result.success && result.success > 0) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Participants</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!result ? (
          <>
            {/* Instructions */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">CSV Format Instructions</h3>
              <p className="text-sm text-blue-800 mb-2">
                Your CSV file should have columns for: <strong>First Name, Last Name, Email</strong>
              </p>
              <p className="text-sm text-blue-800 mb-2">
                Optional: <strong>Gender</strong> (values: Male or Female)
              </p>
              <p className="text-sm text-blue-700">
                Example CSV:
              </p>
              <pre className="text-xs bg-white p-2 rounded mt-2 border border-blue-200">
                {`First Name,Last Name,Email,Gender
John,Doe,john@example.com,Male
Jane,Smith,jane@example.com,Female`}
              </pre>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Note:</strong> No emails will be sent automatically. You&apos;ll need to share login credentials separately.
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>

            {/* OR */}
            <div className="mb-6 text-center text-gray-500 text-sm">
              — OR —
            </div>

            {/* Paste CSV */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV Data
              </label>
              <textarea
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value)
                  parseCSV(e.target.value)
                }}
                placeholder="Paste your CSV data here..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Preview */}
            {parsedData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Preview ({parsedData.length} participants)
                </h3>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">First Name</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Last Name</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2 px-3">{p.firstName}</td>
                          <td className="py-2 px-3">{p.lastName}</td>
                          <td className="py-2 px-3">{p.email}</td>
                          <td className="py-2 px-3">{p.gender || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={parsedData.length === 0 || uploading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : `Upload ${parsedData.length} Participants`}
              </button>
            </div>
          </>
        ) : (
          /* Result */
          <div>
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Upload Complete!</h3>
              <p className="text-green-800">
                Successfully created {result.success} participant{result.success !== 1 ? 's' : ''}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-semibold text-orange-800 mb-2">
                    {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}:
                  </p>
                  <ul className="text-xs text-orange-700 space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Closing automatically...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
