import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '@/store'
import { clearAccessToken } from '@/store/slices/authSlice'
import { format } from 'date-fns'
import {
  Shield,
  Trash2,
  Ban,
  CheckCircle,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { adminApi, type UserWithAnalytics } from '@/api/admin'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import ThemeToggle from '@/components/ThemeToggle'

const creditsSchema = z.object({
  credits: z.number().min(0, 'Credits must be non-negative'),
})

type CreditsFormValues = z.infer<typeof creditsSchema>

const Admin = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentEmail = useSelector((state: RootState) => state.auth.email)
  const [users, setUsers] = useState<UserWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [limit] = useState(20)
  const [editingCreditsUserId, setEditingCreditsUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserWithAnalytics | null>(null)

  const handleLogout = () => {
    dispatch(clearAccessToken())
    navigate('/login')
  }

  const creditsForm = useForm<CreditsFormValues>({
    resolver: zodResolver(creditsSchema),
    defaultValues: {
      credits: 0,
    },
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getAllUsers(skip, limit)
      // Filter out current admin user
      const filteredUsers = response.users.filter((user) => user.email !== currentEmail)
      setUsers(filteredUsers)
      setTotal(response.total)
    } catch (err: any) {
      console.error('Error fetching users:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to fetch users'
      setError(errorMessage)
      if (err.response?.status === 403) {
        toast.error('Access denied. You must be an admin to view this page.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [skip, currentEmail])

  const handleMakeAdmin = async (email: string) => {
    try {
      await adminApi.createAdmin(email)
      toast.success('User promoted to admin successfully')
      fetchUsers()
    } catch (err: any) {
      console.error('Error making user admin:', err)
      toast.error(err.response?.data?.detail || 'Failed to promote user to admin')
    }
  }

  const handleDeleteClick = (user: UserWithAnalytics) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setDeletingUserId(userToDelete.id)
      await adminApi.deleteUser(userToDelete.id)
      toast.success('User deleted successfully')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (err: any) {
      console.error('Error deleting user:', err)
      toast.error(err.response?.data?.detail || 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleRevoke = async (userId: string, isRevoked: boolean) => {
    try {
      if (isRevoked) {
        await adminApi.unrevokeUser(userId)
        toast.success('User access restored successfully')
      } else {
        await adminApi.revokeUser(userId)
        toast.success('User access revoked successfully')
      }
      fetchUsers()
    } catch (err: any) {
      console.error('Error revoking user:', err)
      toast.error(err.response?.data?.detail || 'Failed to revoke user access')
    }
  }

  const handleEditCreditsClick = (user: UserWithAnalytics) => {
    setEditingCreditsUserId(user.id)
    creditsForm.reset({ credits: user.credits })
  }

  const handleCreditsSubmit = async (data: CreditsFormValues) => {
    if (!editingCreditsUserId) return

    try {
      await adminApi.updateUserCredits(editingCreditsUserId, data.credits)
      toast.success('User credits updated successfully')
      setEditingCreditsUserId(null)
      creditsForm.reset()
      fetchUsers()
    } catch (err: any) {
      console.error('Error updating credits:', err)
      toast.error(err.response?.data?.detail || 'Failed to update user credits')
    }
  }

  const handlePreviousPage = () => {
    if (skip > 0) {
      setSkip(Math.max(0, skip - limit))
    }
  }

  const handleNextPage = () => {
    if (skip + limit < total) {
      setSkip(skip + limit)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return 'Invalid date'
    }
  }

  const filteredTotal = total - 1 // Subtract 1 for current admin user

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage users, view analytics, and perform administrative actions.
          </p>
        </div>

      {/* Users Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Credits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">AI Calls</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tokens Used</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Last AI Call</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      {user.is_admin && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                      {!user.is_verified && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          Unverified
                        </span>
                      )}
                      {user.is_revoked ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                          <Ban className="h-3 w-3" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.credits}</td>
                  <td className="px-4 py-3 text-sm">{user.analytics.ai_calls_count}</td>
                  <td className="px-4 py-3 text-sm">
                    {user.analytics.tokens_used.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(user.analytics.last_ai_call_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {!user.is_admin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMakeAdmin(user.email)}
                          className="text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Make Admin
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCreditsClick(user)}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Credits
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(user.id, user.is_revoked)}
                        className={`text-xs ${user.is_revoked ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {user.is_revoked ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Unrevoke
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                        aria-label="Delete user"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t bg-muted/50 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {skip + 1} to {Math.min(skip + limit, filteredTotal)} of {filteredTotal} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={skip === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={skip + limit >= filteredTotal}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone
              and will permanently delete all user data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingUserId !== null}
            >
              {deletingUserId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Credits Dialog */}
      <Dialog
        open={editingCreditsUserId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCreditsUserId(null)
            creditsForm.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Credits</DialogTitle>
            <DialogDescription>
              Update the credits for this user. Credits must be a non-negative number.
            </DialogDescription>
          </DialogHeader>
          <Form {...creditsForm}>
            <form onSubmit={creditsForm.handleSubmit(handleCreditsSubmit)} className="space-y-4">
              <FormField
                control={creditsForm.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCreditsUserId(null)
                    creditsForm.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Credits</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

export default Admin
