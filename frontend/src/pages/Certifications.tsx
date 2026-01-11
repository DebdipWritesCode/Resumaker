import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchCertification, createCertification, updateCertification, deleteCertification } from '@/store/slices/certificationSlice'
import type { CertificationResponse } from '@/api/certification'
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
import { Plus, Info, Award, Edit2, Trash2, Calendar, Link as LinkIcon, User } from 'lucide-react'
import { toast } from 'react-toastify'

// Validation helpers
const titleRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014+&()]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const instructorRegex = /^[a-zA-Z\s,]+$/
const platformRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/

const certificationSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(80, 'Title must be at most 80 characters')
    .regex(titleRegex, 'Title can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —, +, &, ()'),
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
  instructor: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true
        return instructorRegex.test(val)
      },
      { message: 'Instructor can only contain A-Z, a-z, spaces, ,' }
    ),
  platform: z
    .string()
    .min(1, 'Platform is required')
    .max(20, 'Platform must be at most 20 characters')
    .regex(platformRegex, 'Platform can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'),
  certificationLink: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      },
      { message: 'Must be a valid URL' }
    ),
})

type CertificationFormValues = z.infer<typeof certificationSchema>

const Certifications = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { certifications, loading, error } = useSelector((state: RootState) => state.certification)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCertificationId, setEditingCertificationId] = useState<number | null>(null)
  const [originalCertification, setOriginalCertification] = useState<CertificationResponse | null>(null)

  useEffect(() => {
    dispatch(fetchCertification())
  }, [dispatch])

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      title: '',
      startDate: '',
      endDate: '',
      instructor: '',
      platform: '',
      certificationLink: '',
    },
  })

  const handleOpenDialog = () => {
    setEditingCertificationId(null)
    setOriginalCertification(null)
    form.reset({
      title: '',
      startDate: '',
      endDate: '',
      instructor: '',
      platform: '',
      certificationLink: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditCertification = (certificationItem: CertificationResponse) => {
    try {
      setEditingCertificationId(certificationItem.id)
      setOriginalCertification(certificationItem)
      form.reset({
        title: certificationItem.title,
        startDate: certificationItem.start_date,
        endDate: certificationItem.end_date,
        instructor: certificationItem.instructor || '',
        platform: certificationItem.platform,
        certificationLink: certificationItem.certification_link || '',
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditCertification:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteCertification = async (certificationId: number) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) {
      return
    }
    try {
      await dispatch(deleteCertification(certificationId)).unwrap()
      toast.success('Certification deleted successfully')
      dispatch(fetchCertification())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete certification'
      toast.error(errorMessage)
    }
  }

  const onSubmit = async (data: CertificationFormValues) => {
    setIsSubmitting(true)
    try {
      const instructorValue = data.instructor && data.instructor !== '' ? data.instructor : null
      const certificationLinkValue = data.certificationLink && data.certificationLink !== '' ? data.certificationLink : null

      const payload: any = {
        title: data.title,
        start_date: data.startDate,
        end_date: data.endDate,
        platform: data.platform,
        instructor: instructorValue,
        certification_link: certificationLinkValue,
      }

      // For updates, check if optional fields are being cleared
      if (editingCertificationId !== null && originalCertification) {
        // Check if instructor is being cleared (had value, now empty)
        if (originalCertification.instructor && !instructorValue) {
          payload.set_instructor = true
        }
        // Check if certification_link is being cleared (had value, now empty)
        if (originalCertification.certification_link && !certificationLinkValue) {
          payload.set_certification_link = true
        }
      }

      if (editingCertificationId !== null) {
        await dispatch(
          updateCertification({
            certificationId: editingCertificationId,
            data: payload,
          })
        ).unwrap()
        toast.success('Certification updated successfully')
      } else {
        await dispatch(createCertification(payload)).unwrap()
        toast.success('Certification created successfully')
      }

      setIsDialogOpen(false)
      setEditingCertificationId(null)
      setOriginalCertification(null)
      form.reset()
      dispatch(fetchCertification())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save certification'
      toast.error(errorMessage)
      console.error('Failed to save certification:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show error in toast if there's an error and no certifications data (only once)
  useEffect(() => {
    if (error && certifications.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && certifications.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Certifications</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Certifications</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your professional certifications and credentials
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {certifications.length > 0 ? (
        <div className="grid gap-6">
          {certifications.map((certificationItem, index) => (
            <div
              key={certificationItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{certificationItem.title}</h2>
                      <p className="text-sm text-muted-foreground">{certificationItem.platform}</p>
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
                        handleEditCertification(certificationItem)
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
                        handleDeleteCertification(certificationItem.id)
                      }}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Dates Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                      <p className="text-lg font-semibold text-foreground">
                        {certificationItem.start_date} - {certificationItem.end_date}
                      </p>
                    </div>
                  </div>

                  {/* Instructor Section */}
                  {certificationItem.instructor && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Instructor</p>
                        <p className="text-lg font-semibold text-foreground">
                          {certificationItem.instructor}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Certification Link Section */}
                  {certificationItem.certification_link && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <LinkIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Certification Link</p>
                        <a
                          href={certificationItem.certification_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate block"
                        >
                          {certificationItem.certification_link}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-6 sm:p-12 text-center bg-muted/20">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Certifications Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your professional certifications and credentials.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingCertificationId(null)
            setOriginalCertification(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCertificationId !== null ? 'Edit Certification' : 'Add Certification'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingCertificationId !== null
                ? 'Update your certification information.'
                : 'Add a new certification with details about your credentials.'}
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
                      <FormLabel className="mb-3">Certification Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., AWS Certified Solutions Architect"
                          maxLength={80}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 80 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —, +, &, ()
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

              {/* Instructor Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Instructor (Optional)</h3>
                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Instructor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., John Doe"
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Allowed: A-Z, a-z, spaces, ,
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Platform Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Platform</h3>
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Platform</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., AWS, Coursera, Udemy"
                          maxLength={20}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 20 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Certification Link Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Certification Link (Optional)</h3>
                <FormField
                  control={form.control}
                  name="certificationLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Certification Link</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., https://aws.amazon.com/certification/verify"
                          type="url"
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Must be a valid URL.
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
                    setEditingCertificationId(null)
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

export default Certifications
