import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchEducation, createEducation, updateEducation, deleteEducation } from '@/store/slices/educationSlice'
import type { EducationResponse } from '@/api/education'
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
import { Plus, X, Info, GraduationCap, Edit2, Trash2, Calendar, Award, BookOpen } from 'lucide-react'
import { toast } from 'react-toastify'

// Validation helpers
const institutionRegex = /^[a-zA-Z0-9\s,]+$/
const locationRegex = /^[a-zA-Z0-9\s,]+$/
const degreePartRegex = /^[a-zA-Z0-9\s,]+$/
const courseRegex = /^[a-zA-Z0-9\s,]+$/

const courseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(30, 'Course name must be at most 30 characters')
    .regex(courseRegex, 'Course name can only contain alphabets, numbers, spaces, and commas'),
})

const educationSchema = z
  .object({
    institution: z
      .string()
      .min(1, 'Institution is required')
      .max(100, 'Institution must be at most 100 characters')
      .regex(institutionRegex, 'Institution can only contain alphabets, numbers, spaces, and commas'),
    location: z
      .string()
      .min(1, 'Location is required')
      .max(50, 'Location must be at most 50 characters')
      .regex(locationRegex, 'Location can only contain alphabets, numbers, spaces, and commas'),
    degreeProgram: z
      .string()
      .min(1, 'Degree program is required')
      .max(100, 'Degree program must be at most 100 characters')
      .regex(degreePartRegex, 'Degree program can only contain alphabets, numbers, spaces, and commas'),
    degreeMajor: z
      .string()
      .min(1, 'Major/Subject is required')
      .max(100, 'Major/Subject must be at most 100 characters')
      .regex(degreePartRegex, 'Major/Subject can only contain alphabets, numbers, spaces, and commas'),
    degreeSpecialization: z
      .string()
      .max(100, 'Specialization must be at most 100 characters')
      .regex(degreePartRegex, 'Specialization can only contain alphabets, numbers, spaces, and commas')
      .optional(),
    gpa: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          const num = parseFloat(val)
          return !isNaN(num) && num >= 0
        },
        { message: 'GPA must be a valid non-negative number' }
      )
      .refine(
        (val) => {
          if (!val || val === '') return true
          const parts = val.split('.')
          return parts.length <= 2 && (parts[1]?.length || 0) <= 2
        },
        { message: 'GPA must have at most 2 decimal places' }
      ),
    maxGpa: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          const num = parseFloat(val)
          return !isNaN(num) && num > 0
        },
        { message: 'Maximum GPA must be a valid positive number' }
      )
      .refine(
        (val) => {
          if (!val || val === '') return true
          const parts = val.split('.')
          return parts.length <= 2 && (parts[1]?.length || 0) <= 2
        },
        { message: 'Maximum GPA must have at most 2 decimal places' }
      ),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .max(15, 'Start date must be at most 15 characters'),
    endDate: z
      .string()
      .min(1, 'End date is required')
      .max(15, 'End date must be at most 15 characters'),
    courses: z.array(courseSchema).optional(),
  })
  .refine(
    (data) => {
      // If GPA is provided, maxGPA must also be provided
      if (data.gpa && data.gpa !== '') {
        return data.maxGpa && data.maxGpa !== ''
      }
      return true
    },
    {
      message: 'Maximum GPA is required when GPA is provided',
      path: ['maxGpa'],
    }
  )
  .refine(
    (data) => {
      // GPA should not exceed maxGPA
      if (data.gpa && data.gpa !== '' && data.maxGpa && data.maxGpa !== '') {
        const gpa = parseFloat(data.gpa)
        const maxGpa = parseFloat(data.maxGpa)
        return !isNaN(gpa) && !isNaN(maxGpa) && gpa <= maxGpa
      }
      return true
    },
    {
      message: 'GPA cannot exceed Maximum GPA',
      path: ['gpa'],
    }
  )
  .refine(
    (data) => {
      // Total degree length check
      const specialization = data.degreeSpecialization ? ` (${data.degreeSpecialization})` : ''
      const totalDegree = `${data.degreeProgram} - ${data.degreeMajor}${specialization}`
      return totalDegree.length <= 100
    },
    {
      message: 'Total degree length (including all parts) must not exceed 100 characters',
      path: ['degreeSpecialization'],
    }
  )

type EducationFormValues = z.infer<typeof educationSchema>

const Education = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { educations, loading, error } = useSelector((state: RootState) => state.education)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null)
  const [originalEducation, setOriginalEducation] = useState<EducationResponse | null>(null)

  useEffect(() => {
    dispatch(fetchEducation())
  }, [dispatch])

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: '',
      location: '',
      degreeProgram: '',
      degreeMajor: '',
      degreeSpecialization: '',
      gpa: '',
      maxGpa: '',
      startDate: '',
      endDate: '',
      courses: [],
    },
  })

  // Parse degree from format "program - major (specialization)" or "program - major"
  const parseDegree = (degree: string): { program: string; major: string; specialization?: string } => {
    if (!degree) return { program: '', major: '' }
    
    // Check if there's a specialization in parentheses
    const specializationMatch = degree.match(/\(([^)]+)\)$/)
    const specialization = specializationMatch ? specializationMatch[1].trim() : undefined
    
    // Remove specialization from degree string
    const degreeWithoutSpecialization = specialization
      ? degree.replace(/\s*\([^)]+\)$/, '').trim()
      : degree.trim()
    
    // Split by " - " to get program and major
    const parts = degreeWithoutSpecialization.split(' - ')
    if (parts.length >= 2) {
      return {
        program: parts[0].trim(),
        major: parts.slice(1).join(' - ').trim(),
        specialization,
      }
    }
    
    // If no " - " found, treat entire string as program
    return { program: degreeWithoutSpecialization, major: '' }
  }

  // Parse GPA from format "7.84 / 10.00" or number or separate fields
  const parseGpa = (gpaValue: string | number | null | undefined, maxGpaValue?: number | null): { gpa: string; maxGpa: string } => {
    // If we have separate max_gpa field from backend
    if (maxGpaValue !== undefined && maxGpaValue !== null) {
      return {
        gpa: gpaValue ? String(gpaValue) : '',
        maxGpa: String(maxGpaValue),
      }
    }
    
    // Handle null/undefined
    if (!gpaValue && gpaValue !== 0) return { gpa: '', maxGpa: '' }
    
    // If it's a number, we don't have maxGpa info, return empty
    if (typeof gpaValue === 'number') {
      return { gpa: String(gpaValue), maxGpa: '' }
    }
    
    // If it's a string, try to parse "7.84 / 10.00" format
    if (typeof gpaValue === 'string') {
      const parts = gpaValue.split(' / ')
      if (parts.length === 2) {
        return {
          gpa: parts[0].trim(),
          maxGpa: parts[1].trim(),
        }
      }
      // If it's just a number as string, return it
      return { gpa: gpaValue.trim(), maxGpa: '' }
    }
    
    return { gpa: '', maxGpa: '' }
  }

  const handleOpenDialog = () => {
    setEditingEducationId(null)
    setOriginalEducation(null)
    form.reset({
      institution: '',
      location: '',
      degreeProgram: '',
      degreeMajor: '',
      degreeSpecialization: '',
      gpa: '',
      maxGpa: '',
      startDate: '',
      endDate: '',
      courses: [],
    })
    setIsDialogOpen(true)
  }

  const handleEditEducation = (educationItem: EducationResponse) => {
    try {
      setEditingEducationId(educationItem.id)
      setOriginalEducation(educationItem)
      const { program, major, specialization } = parseDegree(educationItem.degree)
      const { gpa, maxGpa } = parseGpa(educationItem.gpa, educationItem.max_gpa)
      
      form.reset({
        institution: educationItem.institution,
        location: educationItem.location,
        degreeProgram: program,
        degreeMajor: major,
        degreeSpecialization: specialization || '',
        gpa: gpa,
        maxGpa: maxGpa,
        startDate: educationItem.start_date,
        endDate: educationItem.end_date,
        courses: educationItem.courses?.map((course) => ({ name: course })) || [],
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditEducation:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteEducation = async (educationId: number) => {
    if (!window.confirm('Are you sure you want to delete this education entry?')) {
      return
    }
    try {
      await dispatch(deleteEducation(educationId)).unwrap()
      toast.success('Education deleted successfully')
      dispatch(fetchEducation())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete education'
      toast.error(errorMessage)
    }
  }

  const { watch, setValue } = form
  const courses = watch('courses') || []
  const gpa = watch('gpa')

  // Format GPA for display: "X / Y" format
  const formatGpaForDisplay = (gpaValue: string | number | null | undefined, maxGpaValue?: number | null): string => {
    if (!gpaValue && gpaValue !== 0) return ''
    const { gpa, maxGpa } = parseGpa(gpaValue, maxGpaValue)
    if (gpa && maxGpa) {
      return `${gpa} / ${maxGpa}`
    }
    return gpa || String(gpaValue)
  }

  // Format degree for backend: "program - major (specialization)" or "program - major"
  const formatDegree = (program: string, major: string, specialization?: string): string => {
    if (!program || !major) return ''
    const base = `${program} - ${major}`
    return specialization && specialization.trim() ? `${base} (${specialization.trim()})` : base
  }

  const onSubmit = async (data: EducationFormValues) => {
    setIsSubmitting(true)
    try {
      const degree = formatDegree(data.degreeProgram, data.degreeMajor, data.degreeSpecialization)
      
      if (!degree) {
        toast.error('Please fill in degree program and major')
        setIsSubmitting(false)
        return
      }

      // Format GPA for backend: send as number if provided
      const gpaValue = data.gpa && data.gpa !== '' ? parseFloat(data.gpa) : null
      const maxGpaValue = data.maxGpa && data.maxGpa !== '' ? parseFloat(data.maxGpa) : null
      
      // If GPA is provided, ensure maxGPA is also provided
      if (gpaValue !== null && maxGpaValue === null) {
        toast.error('Maximum GPA is required when GPA is provided')
        setIsSubmitting(false)
        return
      }

      const coursesArray = data.courses && data.courses.length > 0 
        ? data.courses.map((c) => c.name).filter((name) => name.trim() !== '')
        : []

      const payload: any = {
        institution: data.institution,
        location: data.location,
        degree: degree,
        gpa: gpaValue,
        max_gpa: maxGpaValue,
        start_date: data.startDate,
        end_date: data.endDate,
        courses: coursesArray.length > 0 ? coursesArray : null,
      }

      // For updates, check if optional fields are being cleared
      if (editingEducationId !== null && originalEducation) {
        // Check if gpa is being cleared (had value, now empty)
        if (originalEducation.gpa !== null && originalEducation.gpa !== undefined && gpaValue === null) {
          payload.set_gpa = true
        }
        // Check if max_gpa is being cleared (had value, now empty)
        if (originalEducation.max_gpa !== null && originalEducation.max_gpa !== undefined && maxGpaValue === null) {
          payload.set_max_gpa = true
        }
        // Check if courses is being cleared (had value, now empty)
        if (originalEducation.courses && originalEducation.courses.length > 0 && coursesArray.length === 0) {
          payload.set_courses = true
        }
      }

      if (editingEducationId !== null) {
        await dispatch(
          updateEducation({
            educationId: editingEducationId,
            data: payload,
          })
        ).unwrap()
        toast.success('Education updated successfully')
      } else {
        await dispatch(createEducation(payload)).unwrap()
        toast.success('Education created successfully')
      }

      setIsDialogOpen(false)
      setEditingEducationId(null)
      setOriginalEducation(null)
      form.reset()
      dispatch(fetchEducation())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save education'
      toast.error(errorMessage)
      console.error('Failed to save education:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCourse = () => {
    const currentCourses = courses || []
    setValue('courses', [...currentCourses, { name: '' }], { shouldValidate: false })
  }

  const removeCourse = (index: number) => {
    const currentCourses = courses || []
    setValue('courses', currentCourses.filter((_, i) => i !== index), { shouldValidate: true })
  }

  // Show error in toast if there's an error and no educations data (only once)
  useEffect(() => {
    if (error && educations.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && educations.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Education</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Education</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your educational background and qualifications
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>

      {educations.length > 0 ? (
        <div className="grid gap-6">
          {educations.map((educationItem, index) => (
            <div
              key={educationItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{educationItem.institution}</h2>
                      <p className="text-sm text-muted-foreground">{educationItem.location}</p>
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
                        handleEditEducation(educationItem)
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
                        handleDeleteEducation(educationItem.id)
                      }}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Degree Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Degree</p>
                      <p className="text-lg font-semibold text-foreground">
                        {educationItem.degree || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                      <p className="text-lg font-semibold text-foreground">
                        {educationItem.start_date} - {educationItem.end_date}
                      </p>
                    </div>
                  </div>

                  {/* GPA Section */}
                  {educationItem.gpa && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">GPA</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatGpaForDisplay(educationItem.gpa, educationItem.max_gpa)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Courses Section */}
                  {educationItem.courses && educationItem.courses.length > 0 && (
                    <div className="flex items-start gap-4">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Courses</p>
                        <div className="space-y-2">
                          {educationItem.courses.map((course, courseIndex) => (
                            <div
                              key={courseIndex}
                              className="group/course flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                            >
                              <div className="p-1.5 rounded-md bg-primary/10 group-hover/course:bg-primary/20 transition-colors">
                                <BookOpen className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">{course}</p>
                              </div>
                            </div>
                          ))}
                        </div>
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
              <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Education Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your educational qualifications and achievements.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingEducationId(null)
              setOriginalEducation(null)
              form.reset()
            }
          }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingEducationId !== null ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingEducationId !== null
                ? 'Update your educational information.'
                : 'Add a new education entry with your qualifications and achievements.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Institution Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Institution</h3>
                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Institution Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Massachusetts Institute of Technology"
                          maxLength={100}
                          className='mt-2'
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 100 characters. Only alphabets, numbers, spaces, and commas allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Location</h3>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Location</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Cambridge, MA, USA"
                          maxLength={50}
                          className='mt-2'
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 50 characters. Format: "Education Centre State, Education Center Country" is appropriate for resumes. Only alphabets, numbers, spaces, and commas allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Degree Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Degree</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="degreeProgram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Degree Program</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Bachelor of Technology"
                            maxLength={100}
                            className='mt-2'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="degreeMajor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Major/Subject</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Computer Science"
                            maxLength={100}
                            className='mt-2'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="degreeSpecialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Specialization (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., AI-ML specialization"
                            maxLength={100}
                            className='mt-2'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Total degree length (including all parts) must not exceed 100 characters. Only alphabets, numbers, spaces, and commas allowed.
                </p>
              </div>

              {/* GPA Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">GPA (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">GPA</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="e.g., 7.84"
                            className='mt-2'
                          />
                        </FormControl>
                        <FormDescription>
                          Optional. Must be non-negative and not exceed Maximum GPA. Maximum 2 decimal places.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxGpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Maximum GPA</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="e.g., 10.00"
                            disabled={!gpa || gpa === ''}
                            className='mt-2'
                          />
                        </FormControl>
                        <FormDescription>
                          Required if GPA is provided. Maximum 2 decimal places.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dates Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Dates</h3>
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
                            placeholder="e.g., Aug 2020"
                            maxLength={15}
                            className='mt-2'
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 15 characters. Recommended format: "Month Year" (e.g., Aug 2027).
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
                            placeholder="e.g., May 2024 or Present"
                            maxLength={15}
                            className='mt-2'
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 15 characters. Can be "Present" or date. Recommended format: "Month Year" (e.g., Aug 2027).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Courses Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Courses</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCourse}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </div>

                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Each course can only contain alphabets, numbers, spaces, and commas. Maximum 30 characters per course.
                  </p>
                </div>

                {courses.map((_, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`courses.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl className="flex-1">
                              <Input
                                {...field}
                                placeholder="e.g., Data Structures and Algorithms"
                                maxLength={30}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCourse(index)}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                {courses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No courses added. Click "Add Course" to add one.
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingEducationId(null)
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

export default Education
