import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchExperience, createExperience, updateExperience, deleteExperience } from '@/store/slices/experienceSlice'
import type { ExperienceResponse } from '@/api/experience'
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
import { Plus, X, Info, Briefcase, Edit2, Trash2, Calendar, FolderKanban, Sparkles } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '@/api/axios'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Validation helpers
const companyRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const locationRegex = /^[a-zA-Z0-9\s,]+$/
const positionRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const projectTitleRegex = /^[a-zA-Z0-9\s,]+$/
const projectDescriptionRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/

const projectItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(40, 'Project title must be at most 40 characters')
    .regex(projectTitleRegex, 'Project title can only contain A-Z, a-z, 0-9, spaces, ,'),
  description: z
    .string()
    .min(1, 'Project description is required')
    .max(250, 'Project description must be at most 250 characters')
    .regex(projectDescriptionRegex, 'Project description can only contain A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %'),
})

const experienceSchema = z.object({
  company: z
    .string()
    .min(1, 'Company is required')
    .max(50, 'Company must be at most 50 characters')
    .regex(companyRegex, 'Company can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(60, 'Location must be at most 60 characters')
    .regex(locationRegex, 'Location can only contain A-Z, a-z, 0-9, spaces, ,'),
  position: z
    .string()
    .min(1, 'Position is required')
    .max(40, 'Position must be at most 40 characters')
    .regex(positionRegex, 'Position can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'),
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
  projects: z.array(projectItemSchema).optional(),
})

type ExperienceFormValues = z.infer<typeof experienceSchema>

const Experience = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { experiences, loading, error } = useSelector((state: RootState) => state.experience)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null)
  const [rephrasingProjectIndex, setRephrasingProjectIndex] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchExperience())
  }, [dispatch])

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: '',
      location: '',
      position: '',
      startDate: '',
      endDate: '',
      projects: [],
    },
  })

  const handleOpenDialog = () => {
    setEditingExperienceId(null)
    form.reset({
      company: '',
      location: '',
      position: '',
      startDate: '',
      endDate: '',
      projects: [],
    })
    setIsDialogOpen(true)
  }

  const handleEditExperience = (experienceItem: ExperienceResponse) => {
    try {
      setEditingExperienceId(experienceItem.id)
      form.reset({
        company: experienceItem.company,
        location: experienceItem.location,
        position: experienceItem.position,
        startDate: experienceItem.start_date,
        endDate: experienceItem.end_date,
        projects: experienceItem.projects?.map((project) => ({
          title: project.title,
          description: project.description.replace(/\\%/g, '%'), // Unescape % symbols for editing
        })) || [],
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditExperience:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteExperience = async (experienceId: number) => {
    if (!window.confirm('Are you sure you want to delete this experience entry?')) {
      return
    }
    try {
      await dispatch(deleteExperience(experienceId)).unwrap()
      toast.success('Experience deleted successfully')
      dispatch(fetchExperience())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete experience'
      toast.error(errorMessage)
    }
  }

  const { watch, setValue } = form
  const projects = watch('projects') || []

  // Escape % symbols before sending to backend (for LaTeX compatibility)
  const escapePercentSymbols = (text: string): string => {
    return text.replace(/%/g, '\\%')
  }

  const onSubmit = async (data: ExperienceFormValues) => {
    setIsSubmitting(true)
    try {
      // Escape % symbols in project descriptions
      const projectsArray = data.projects && data.projects.length > 0 
        ? data.projects.map((project) => ({
            title: project.title,
            description: escapePercentSymbols(project.description),
          }))
        : []

      const payload = {
        company: data.company,
        location: data.location,
        position: data.position,
        start_date: data.startDate,
        end_date: data.endDate,
        projects: projectsArray,
      }

      if (editingExperienceId !== null) {
        await dispatch(
          updateExperience({
            experienceId: editingExperienceId,
            data: payload,
          })
        ).unwrap()
        toast.success('Experience updated successfully')
      } else {
        await dispatch(createExperience(payload)).unwrap()
        toast.success('Experience created successfully')
      }

      setIsDialogOpen(false)
      setEditingExperienceId(null)
      form.reset()
      dispatch(fetchExperience())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save experience'
      toast.error(errorMessage)
      console.error('Failed to save experience:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addProject = () => {
    const currentProjects = projects || []
    setValue('projects', [...currentProjects, { title: '', description: '' }], { shouldValidate: false })
  }

  const removeProject = (index: number) => {
    const currentProjects = projects || []
    setValue('projects', currentProjects.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleRephraseProjectDescription = async (projectIndex: number) => {
    const project = projects[projectIndex]
    if (!project || !project.title || !project.description) {
      toast.error('Please fill in the project title and description first')
      return
    }

    setRephrasingProjectIndex(projectIndex)
    try {
      const response = await api.post('/api/ai/rephrase-experience-project', {
        title: project.title,
        current_description: project.description,
        validation_rule: 'Maximum 250 characters',
      })

      if (response.data?.rephrased_description) {
        setValue(`projects.${projectIndex}.description`, response.data.rephrased_description, {
          shouldValidate: true,
        })
        toast.success('Description rephrased successfully')
      } else {
        toast.error('No rephrased description received')
      }
    } catch (error: any) {
      console.error('Error rephrasing project description:', error)
      toast.error(error.response?.data?.detail || 'Failed to rephrase description')
    } finally {
      setRephrasingProjectIndex(null)
    }
  }

  // Show error in toast if there's an error and no experiences data (only once)
  useEffect(() => {
    if (error && experiences.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && experiences.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Experience</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Experience</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your work experience and professional projects
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {experiences.length > 0 ? (
        <div className="grid gap-6">
          {experiences.map((experienceItem, index) => (
            <div
              key={experienceItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{experienceItem.company}</h2>
                      <p className="text-sm text-muted-foreground">{experienceItem.location}</p>
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
                        handleEditExperience(experienceItem)
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
                        handleDeleteExperience(experienceItem.id)
                      }}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Position Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Position</p>
                      <p className="text-lg font-semibold text-foreground">
                        {experienceItem.position || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                      <p className="text-lg font-semibold text-foreground">
                        {experienceItem.start_date} - {experienceItem.end_date}
                      </p>
                    </div>
                  </div>

                  {/* Projects Section */}
                  {experienceItem.projects && experienceItem.projects.length > 0 && (
                    <div className="flex items-start gap-4">
                      <FolderKanban className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Projects</p>
                        <div className="space-y-2">
                          {experienceItem.projects.map((project, projectIndex) => (
                            <div
                              key={projectIndex}
                              className="group/project p-4 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-md bg-primary/10 group-hover/project:bg-primary/20 transition-colors shrink-0 mt-0.5">
                                  <FolderKanban className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm mb-1">{project.title}</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {project.description.replace(/\\%/g, '%')}
                                  </p>
                                </div>
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
              <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Experience Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your work experience and professional projects.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingExperienceId(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingExperienceId !== null ? 'Edit Experience' : 'Add Experience'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingExperienceId !== null
                ? 'Update your work experience information.'
                : 'Add a new experience entry with your work history and projects.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Company</h3>
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Company Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Google Inc."
                          maxLength={50}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 50 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
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
                          placeholder="e.g., Mountain View, CA, USA"
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
                          placeholder="e.g., Software Engineer"
                          maxLength={40}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 40 characters. Only alphabets, numbers, spaces, and commas allowed.
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

              {/* Projects Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Projects</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProject}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </div>

                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have 1-3 project descriptions.
                  </p>
                </div>

                {projects.map((_, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Project {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProject(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`projects.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-3">Project Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., E-commerce Platform"
                              maxLength={40}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum 40 characters. Allowed: A-Z, a-z, 0-9, spaces, ,
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`projects.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-3">
                            <FormLabel>Project Description</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRephraseProjectDescription(index)}
                                    disabled={rephrasingProjectIndex === index || !field.value || !projects[index]?.title}
                                  >
                                    {rephrasingProjectIndex === index ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    ) : (
                                      <Sparkles className="h-4 w-4 text-primary" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="end">
                                  <p>Rephrase with AI</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="e.g., Built a scalable e-commerce platform that increased sales by 25%"
                              maxLength={250}
                              rows={3}
                              className="mt-2"
                              disabled={rephrasingProjectIndex === index}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum 250 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, % (e.g., "increased by 25%" or "4x faster" or "4× faster").
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                {projects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No projects added. Click "Add Project" to add one.
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingExperienceId(null)
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

export default Experience
