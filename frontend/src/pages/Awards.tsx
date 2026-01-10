import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchAward, createAward, updateAward, deleteAward } from '@/store/slices/awardSlice'
import type { AwardResponse } from '@/api/award'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Plus, Info, Trophy, Edit2, Trash2, Calendar } from 'lucide-react'
import { toast } from 'react-toastify'

// Validation helpers
const titleRegex = /^[a-zA-Z0-9\s,\-]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/

const awardSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters')
    .regex(titleRegex, 'Title can only contain alphabets, numbers, spaces, commas, and hyphens'),
  date: z
    .string()
    .min(1, 'Date is required')
    .max(15, 'Date must be at most 15 characters')
    .regex(dateRegex, 'Date can only contain alphabets, numbers, and spaces'),
})

type AwardFormValues = z.infer<typeof awardSchema>

const Awards = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { awards, loading, error } = useSelector((state: RootState) => state.award)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingAwardId, setEditingAwardId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchAward())
  }, [dispatch])

  const form = useForm<AwardFormValues>({
    resolver: zodResolver(awardSchema),
    defaultValues: {
      title: '',
      date: '',
    },
  })

  const handleOpenDialog = () => {
    setEditingAwardId(null)
    form.reset({
      title: '',
      date: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditAward = (awardItem: AwardResponse) => {
    try {
      setEditingAwardId(awardItem.id)
      form.reset({
        title: awardItem.title,
        date: awardItem.date,
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditAward:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteAward = async (awardId: number) => {
    if (!window.confirm('Are you sure you want to delete this award?')) {
      return
    }
    try {
      await dispatch(deleteAward(awardId)).unwrap()
      toast.success('Award deleted successfully')
      dispatch(fetchAward())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete award'
      toast.error(errorMessage)
    }
  }

  const onSubmit = async (data: AwardFormValues) => {
    setIsSubmitting(true)
    try {
      const payload = {
        title: data.title,
        date: data.date,
      }

      if (editingAwardId !== null) {
        await dispatch(
          updateAward({
            awardId: editingAwardId,
            data: payload,
          })
        ).unwrap()
        toast.success('Award updated successfully')
      } else {
        await dispatch(createAward(payload)).unwrap()
        toast.success('Award created successfully')
      }

      setIsDialogOpen(false)
      setEditingAwardId(null)
      form.reset()
      dispatch(fetchAward())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save award'
      toast.error(errorMessage)
      console.error('Failed to save award:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show error in toast if there's an error and no awards data (only once)
  useEffect(() => {
    if (error && awards.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && awards.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Awards</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Awards</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your awards and recognitions
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Award
        </Button>
      </div>

      {awards.length > 0 ? (
        <div className="grid gap-6">
          {awards.map((awardItem, index) => (
            <div
              key={awardItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{awardItem.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditAward(awardItem)
                      }}
                      className="shrink-0 hover:bg-primary/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteAward(awardItem.id)
                      }}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Date Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                      <p className="text-lg font-semibold text-foreground">
                        {awardItem.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-6 sm:p-12 text-center bg-muted/20">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Awards Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your awards and recognitions.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Award
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingAwardId(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingAwardId !== null ? 'Edit Award' : 'Add Award'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingAwardId !== null
                ? 'Update your award information.'
                : 'Add a new award with details about your recognition.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Title</h3>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Award Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Best Student Award"
                          maxLength={120}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 120 characters. Only alphabets, numbers, spaces, commas, and hyphens allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Date</h3>
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have time in format of "Month, Year" like "Jan, 2025".
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Jan 2025"
                          maxLength={15}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 15 characters. Only alphabets, numbers, and spaces allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingAwardId(null)
                    form.reset()
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Awards
