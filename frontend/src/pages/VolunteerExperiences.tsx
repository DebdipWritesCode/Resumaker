import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchVolunteer, createVolunteer, updateVolunteer, deleteVolunteer } from '@/store/slices/volunteerSlice'
import type { VolunteerResponse } from '@/api/volunteer'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Info, HeartHandshake, Edit2, Trash2, Calendar, Building2, Sparkles } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '@/api/axios'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { REPHRASE_COST } from '@/utils/paymentConstants'
import { checkCredits, getCreditErrorMessage, handleCreditError, updateCreditsAfterOperation } from '@/utils/creditUtils'

// Validation helpers
const positionRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014&]+$/
const organizationRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const locationRegex = /^[a-zA-Z0-9\s,]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const descriptionRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/

const volunteerSchema = z.object({
  position: z
    .string()
    .min(1, 'Position is required')
    .max(50, 'Position must be at most 50 characters')
    .regex(positionRegex, 'Position can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —, &'),
  organization: z
    .string()
    .min(1, 'Organization is required')
    .max(100, 'Organization must be at most 100 characters')
    .regex(organizationRegex, 'Organization can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(60, 'Location must be at most 60 characters')
    .regex(locationRegex, 'Location can only contain A-Z, a-z, 0-9, spaces, ,'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(250, 'Description must be at most 250 characters')
    .regex(descriptionRegex, 'Description can only contain A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %'),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .max(15, 'Start date must be at most 15 characters')
    .regex(dateRegex, 'Start date can only contain A-Z, a-z, 0-9, spaces'),
  endDate: z
    .string()
    .min(1, 'End date is required')
    .max(15, 'End date must be at most 15 characters')
    .regex(dateRegex, 'End date can only contain A-Z, a-z, 0-9, spaces'),
})

type VolunteerFormValues = z.infer<typeof volunteerSchema>

const VolunteerExperiences = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { volunteers, loading, error } = useSelector((state: RootState) => state.volunteer)
  const credits = useSelector((state: RootState) => state.auth.credits)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVolunteerId, setEditingVolunteerId] = useState<number | null>(null)
  const [isRephrasingDescription, setIsRephrasingDescription] = useState(false)

  useEffect(() => {
    dispatch(fetchVolunteer())
  }, [dispatch])

  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      position: '',
      organization: '',
      location: '',
      description: '',
      startDate: '',
      endDate: '',
    },
  })

  const handleOpenDialog = () => {
    setEditingVolunteerId(null)
    form.reset({
      position: '',
      organization: '',
      location: '',
      description: '',
      startDate: '',
      endDate: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditVolunteer = (volunteerItem: VolunteerResponse) => {
    try {
      setEditingVolunteerId(volunteerItem.id)
      form.reset({
        position: volunteerItem.position,
        organization: volunteerItem.organization,
        location: volunteerItem.location,
        description: volunteerItem.description.replace(/\\%/g, '%').replace(/\\./g, '.'),
        startDate: volunteerItem.start_date,
        endDate: volunteerItem.end_date,
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditVolunteer:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteVolunteer = async (volunteerId: number) => {
    if (!window.confirm('Are you sure you want to delete this volunteer experience?')) {
      return
    }
    try {
      await dispatch(deleteVolunteer(volunteerId)).unwrap()
      toast.success('Volunteer experience deleted successfully')
      dispatch(fetchVolunteer())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete volunteer experience'
      toast.error(errorMessage)
    }
  }

  const escapeSpecialSymbols = (text: string): string => {
    return text.replace(/%/g, '\\%').replace(/\./g, '\\.')
  }

  const { watch, setValue } = form

  const handleRephraseDescription = async () => {
    const position = watch('position')
    const description = watch('description')

    if (!description) {
      toast.error('Please fill in the description first')
      return
    }

    if (!position) {
      toast.error('Please fill in the position first')
      return
    }

    // Check credits before proceeding
    if (!checkCredits(REPHRASE_COST, credits)) {
      toast.error(getCreditErrorMessage(REPHRASE_COST, credits))
      return
    }

    setIsRephrasingDescription(true)
    try {
      const response = await api.post('/api/ai/rephrase-volunteer-description', {
        title: position,
        current_description: description,
        validation_rule: 'Maximum 250 characters',
      })

      // Update credits after successful rephrase
      updateCreditsAfterOperation(response, dispatch, credits, REPHRASE_COST)

      if (response.data?.rephrased_description) {
        setValue('description', response.data.rephrased_description, {
          shouldValidate: true,
        })
        toast.success('Description rephrased successfully')
      } else {
        toast.error('No rephrased description received')
      }
    } catch (error: any) {
      console.error('Error rephrasing description:', error)
      // Handle credit errors specifically
      if (error.response?.status === 400 && 
          (error.response?.data?.detail?.toLowerCase().includes('insufficient credits') ||
           error.response?.data?.detail?.toLowerCase().includes('credit'))) {
        handleCreditError(error, dispatch)
      } else {
        toast.error(error.response?.data?.detail || 'Failed to rephrase description')
      }
    } finally {
      setIsRephrasingDescription(false)
    }
  }

  const onSubmit = async (data: VolunteerFormValues) => {
    setIsSubmitting(true)
    try {
      const payload = {
        position: data.position,
        organization: data.organization,
        location: data.location,
        description: escapeSpecialSymbols(data.description),
        start_date: data.startDate,
        end_date: data.endDate,
      }

      if (editingVolunteerId !== null) {
        await dispatch(
          updateVolunteer({
            volunteerId: editingVolunteerId,
            data: payload,
          })
        ).unwrap()
        toast.success('Volunteer experience updated successfully')
      } else {
        await dispatch(createVolunteer(payload)).unwrap()
        toast.success('Volunteer experience created successfully')
      }

      setIsDialogOpen(false)
      setEditingVolunteerId(null)
      form.reset()
      dispatch(fetchVolunteer())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save volunteer experience'
      toast.error(errorMessage)
      console.error('Failed to save volunteer experience:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show error in toast if there's an error and no volunteers data (only once)
  useEffect(() => {
    if (error && volunteers.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && volunteers.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Volunteer Experiences</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Volunteer Experiences</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your volunteer work and community service experiences
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Volunteer Experience
        </Button>
      </div>

      {volunteers.length > 0 ? (
        <div className="grid gap-6">
          {volunteers.map((volunteerItem, index) => (
            <div
              key={volunteerItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <HeartHandshake className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{volunteerItem.position}</h2>
                      <p className="text-sm text-muted-foreground">{volunteerItem.organization}</p>
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
                        handleEditVolunteer(volunteerItem)
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
                        handleDeleteVolunteer(volunteerItem.id)
                      }}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Organization Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Organization</p>
                      <p className="text-lg font-semibold text-foreground">
                        {volunteerItem.organization}
                      </p>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                      <p className="text-lg font-semibold text-foreground">
                        {volunteerItem.location}
                      </p>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                      <p className="text-lg font-semibold text-foreground">
                        {volunteerItem.start_date} - {volunteerItem.end_date}
                      </p>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <HeartHandshake className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-lg font-semibold text-foreground whitespace-pre-wrap">
                        {volunteerItem.description.replace(/\\%/g, '%').replace(/\\./g, '.')}
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
              <HeartHandshake className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Volunteer Experiences Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your volunteer work and community service experiences.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Volunteer Experience
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingVolunteerId(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingVolunteerId !== null ? 'Edit Volunteer Experience' : 'Add Volunteer Experience'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingVolunteerId !== null
                ? 'Update your volunteer experience information.'
                : 'Add a new volunteer experience with details about your community service.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Position Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Position</h3>
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Position</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Volunteer Coordinator"
                          maxLength={50}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 50 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —, &
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Organization Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Organization</h3>
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Organization</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Local Food Bank"
                          maxLength={100}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 100 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Location</h3>
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have location as "City, State, Country" format.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Location</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., City, State, Country"
                          maxLength={60}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 60 characters. Allowed: A-Z, a-z, 0-9, spaces, ,
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold">Description</h3>
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-3">
                        <FormLabel>Description</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleRephraseDescription}
                                disabled={isRephrasingDescription || !field.value || !watch('position') || !checkCredits(REPHRASE_COST, credits)}
                              >
                                {isRephrasingDescription ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                  <Sparkles className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end">
                              <p>Rephrase with AI ({REPHRASE_COST} credits)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Organized food distribution events and managed volunteer schedules"
                          maxLength={250}
                          rows={4}
                          className="mt-2"
                          disabled={isRephrasingDescription}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 250 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Dates</h3>
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have time in format of "Month, Year" like "Aug, 2027".
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Start Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Aug, 2020"
                            maxLength={15}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 15 characters. Allowed: A-Z, a-z, 0-9, spaces
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">End Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Dec, 2023 or Present"
                            maxLength={15}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 15 characters. Can be "Present" or date. Allowed: A-Z, a-z, 0-9, spaces
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingVolunteerId(null)
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

export default VolunteerExperiences
