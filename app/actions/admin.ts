'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getAllUsers() {
  const supabase = await createClient()

  // Get the current user to check if they're an admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  // Use Supabase Admin client to list all users
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    console.error('Error fetching users:', error)
    return { error: error.message }
  }

  return { users: data.users }
}

export async function updateUserRole(userId: string, role: 'admin' | 'participant') {
  const supabase = await createClient()

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  // Update user metadata using admin client
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { role }
  })

  if (error) {
    console.error('Error updating user role:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  // Don't allow deleting yourself
  if (user.id === userId) {
    return { error: 'Cannot delete your own account' }
  }

  // Delete user using admin client
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
