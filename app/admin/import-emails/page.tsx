'use client'

import { useState } from 'react'
import { importExistingEmails } from '@/app/actions/import-emails'

export default function ImportEmailsPage() {
  const [emailList, setEmailList] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: any[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    // Parse emails from text area (one per line or comma separated)
    const emails = emailList
      .split(/[\n,]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emails.length === 0) {
      setError('Please enter at least one email address')
      setLoading(false)
      return
    }

    const importResult = await importExistingEmails(emails)

    if (importResult.error) {
      setError(importResult.error)
    } else {
      setResult({
        success: importResult.success || 0,
        errors: importResult.errors || []
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Admin - Import Emails</h1>
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Import Existing Email Registrations
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter email addresses of users who have already registered through another method.
              Each user will be created as a participant with their email, and they can claim their account later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {result && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800 font-semibold">
                  Successfully imported {result.success} email{result.success !== 1 ? 's' : ''}
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-orange-800 font-semibold mb-2">
                      {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}:
                    </p>
                    <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>
                          {err.email}: {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Format:</strong> Enter one email per line, or separate with commas.
                Users will be able to claim their account by visiting the "Claim Account" page.
              </p>
            </div>

            <div>
              <label htmlFor="emailList" className="block text-sm font-medium text-gray-700 mb-2">
                Email Addresses
              </label>
              <textarea
                id="emailList"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                rows={10}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 font-mono text-sm"
                placeholder="example1@email.com&#10;example2@email.com&#10;example3@email.com"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter email addresses separated by new lines or commas
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import Email Addresses'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>After importing, users can visit <code className="bg-gray-100 px-2 py-1 rounded">/claim-account</code></li>
              <li>They'll enter their email and receive a password reset link</li>
              <li>After setting their password, they'll complete their profile with additional information</li>
              <li>They can then access their account and register for races</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
