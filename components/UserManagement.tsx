'use client'

import { useState, useEffect } from 'react'
import { getAllUsers, updateUserRole, deleteUser } from '@/app/actions/admin'
import type { User } from '@supabase/supabase-js'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const result = await getAllUsers()
    if (result.error) {
      setError(result.error)
    } else if (result.users) {
      setUsers(result.users)
    }
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, role: 'admin' | 'participant') => {
    const confirmed = confirm(`Are you sure you want to change this user's role to ${role}?`)
    if (!confirmed) return

    const result = await updateUserRole(userId, role)
    if (result.error) {
      alert(result.error)
    } else {
      loadUsers()
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmed = confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)
    if (!confirmed) return

    const result = await deleteUser(userId)
    if (result.error) {
      alert(result.error)
    } else {
      loadUsers()
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage user roles and permissions. Admins can access the admin dashboard, participants can only access their race results.
        </p>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Sign In
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => {
                const role = user.user_metadata?.role || 'participant'
                return (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {role === 'admin' ? (
                          <button
                            onClick={() => handleRoleChange(user.id, 'participant')}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Demote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Promote
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email || 'this user')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
