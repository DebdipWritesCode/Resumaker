import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchProject, createProject, updateProject, deleteProject } from '@/store/slices/projectSlice'
import type { ProjectResponse } from '@/api/project'
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
import { Plus, X, Info, FolderKanban, Edit2, Trash2, Calendar, Code, Link as LinkIcon, Sparkles } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '@/api/axios'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { REPHRASE_COST } from '@/utils/paymentConstants'
import { checkCredits, getCreditErrorMessage, handleCreditError, updateCreditsAfterOperation } from '@/utils/creditUtils'

// Validation helpers
const nameRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const linkLabelRegex = /^[a-zA-Z0-9\s]+$/
const subpointRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/

const subpointSchema = z.object({
  text: z
    .string()
    .min(1, 'Subpoint is required')
    .max(250, 'Subpoint must be at most 250 characters')
    .regex(subpointRegex, 'Subpoint can only contain A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %'),
})

const projectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name must be at most 100 characters')
      .regex(nameRegex, 'Project name can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'),
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
    techStack: z
      .string()
      .min(1, 'Tech stack is required')
      .max(100, 'Tech stack must be at most 100 characters'),
    link: z
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
    linkLabel: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return val.length <= 30 && linkLabelRegex.test(val)
        },
        { message: 'Link label must be at most 30 characters and can only contain A-Z, a-z, 0-9, spaces' }
      ),
    subpoints: z.array(subpointSchema).optional(),
  })
  .refine(
    (data) => {
      // If link is provided, linkLabel must also be provided
      if (data.link && data.link !== '') {
        return data.linkLabel && data.linkLabel !== ''
      }
      return true
    },
    {
      message: 'Link label is required when link is provided',
      path: ['linkLabel'],
    }
  )

type ProjectFormValues = z.infer<typeof projectSchema>

const Projects = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { projects, loading, error } = useSelector((state: RootState) => state.project)
  const credits = useSelector((state: RootState) => state.auth.credits)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [originalProject, setOriginalProject] = useState<ProjectResponse | null>(null)
  const [rephrasingSubpointIndex, setRephrasingSubpointIndex] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchProject())
  }, [dispatch])

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      techStack: '',
      link: '',
      linkLabel: '',
      subpoints: [],
    },
  })

  const handleOpenDialog = () => {
    setEditingProjectId(null)
    setOriginalProject(null)
    form.reset({
      name: '',
      startDate: '',
      endDate: '',
      techStack: '',
      link: '',
      linkLabel: '',
      subpoints: [],
    })
    setIsDialogOpen(true)
  }

  const handleEditProject = (projectItem: ProjectResponse) => {
    try {
      setEditingProjectId(projectItem.id)
      setOriginalProject(projectItem)
      form.reset({
        name: projectItem.name,
        startDate: projectItem.start_date,
        endDate: projectItem.end_date,
        techStack: projectItem.tech_stack,
        link: projectItem.link || '',
        linkLabel: projectItem.link_label || '',
        subpoints: projectItem.subpoints?.map((subpoint) => ({
          text: subpoint.replace(/\\%/g, '%').replace(/\\./g, '.'), // Unescape % and . symbols for editing
        })) || [],
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditProject:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }
    try {
      await dispatch(deleteProject(projectId)).unwrap()
      toast.success('Project deleted successfully')
      dispatch(fetchProject())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete project'
      toast.error(errorMessage)
    }
  }

  const { watch, setValue } = form
  const subpoints = watch('subpoints') || []
  const link = watch('link')

  // Escape % and . symbols before sending to backend (for LaTeX compatibility)
  const escapeSpecialSymbols = (text: string): string => {
    return text.replace(/%/g, '\\%').replace(/\./g, '\\.')
  }

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true)
    try {
      // Escape % and . symbols in subpoints
      const subpointsArray = data.subpoints && data.subpoints.length > 0 
        ? data.subpoints.map((subpoint) => escapeSpecialSymbols(subpoint.text))
        : []

      const linkValue = data.link && data.link !== '' ? data.link : null
      const linkLabelValue = data.linkLabel && data.linkLabel !== '' ? data.linkLabel : null

      const payload: any = {
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        tech_stack: data.techStack,
        link: linkValue,
        link_label: linkLabelValue,
        subpoints: subpointsArray,
      }

      // For updates, check if optional fields are being cleared
      if (editingProjectId !== null && originalProject) {
        // Check if link is being cleared (had value, now empty)
        if (originalProject.link && !linkValue) {
          payload.set_link = true
        }
        // Check if link_label is being cleared (had value, now empty)
        if (originalProject.link_label && !linkLabelValue) {
          payload.set_link_label = true
        }
        // Check if subpoints is being cleared (had value, now empty)
        if (originalProject.subpoints && originalProject.subpoints.length > 0 && subpointsArray.length === 0) {
          payload.set_subpoints = true
        }
      }

      if (editingProjectId !== null) {
        await dispatch(
          updateProject({
            projectId: editingProjectId,
            data: payload,
          })
        ).unwrap()
        toast.success('Project updated successfully')
      } else {
        await dispatch(createProject(payload)).unwrap()
        toast.success('Project created successfully')
      }

      setIsDialogOpen(false)
      setEditingProjectId(null)
      setOriginalProject(null)
      form.reset()
      dispatch(fetchProject())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save project'
      toast.error(errorMessage)
      console.error('Failed to save project:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSubpoint = () => {
    const currentSubpoints = subpoints || []
    setValue('subpoints', [...currentSubpoints, { text: '' }], { shouldValidate: false })
  }

  const removeSubpoint = (index: number) => {
    const currentSubpoints = subpoints || []
    setValue('subpoints', currentSubpoints.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleRephraseSubpoint = async (subpointIndex: number) => {
    const subpoint = subpoints[subpointIndex]
    const projectName = watch('name')
    
    if (!subpoint || !subpoint.text) {
      toast.error('Please fill in the subpoint first')
      return
    }

    if (!projectName) {
      toast.error('Please fill in the project name first')
      return
    }

    // Check credits before proceeding
    if (!checkCredits(REPHRASE_COST, credits)) {
      toast.error(getCreditErrorMessage(REPHRASE_COST, credits))
      return
    }

    setRephrasingSubpointIndex(subpointIndex)
    try {
      // Get other subpoints (excluding the current one)
      const otherSubpoints = subpoints
        .filter((_, idx) => idx !== subpointIndex)
        .map(sp => sp.text)

      const response = await api.post('/api/ai/rephrase-project-subpoints', {
        title: projectName,
        current_subpoints: [subpoint.text],
        other_subpoints: otherSubpoints,
        validation_rule: 'Maximum 250 characters per point',
      })

      // Update credits after successful rephrase
      updateCreditsAfterOperation(response, dispatch, credits, REPHRASE_COST)

      if (response.data?.rephrased_subpoints && response.data.rephrased_subpoints.length > 0) {
        setValue(`subpoints.${subpointIndex}.text`, response.data.rephrased_subpoints[0], {
          shouldValidate: true,
        })
        toast.success('Subpoint rephrased successfully')
      } else {
        toast.error('No rephrased subpoint received')
      }
    } catch (error: any) {
      console.error('Error rephrasing subpoint:', error)
      // Handle credit errors specifically
      if (error.response?.status === 400 && 
          (error.response?.data?.detail?.toLowerCase().includes('insufficient credits') ||
           error.response?.data?.detail?.toLowerCase().includes('credit'))) {
        handleCreditError(error, dispatch)
      } else {
        toast.error(error.response?.data?.detail || 'Failed to rephrase subpoint')
      }
    } finally {
      setRephrasingSubpointIndex(null)
    }
  }

  // Show error in toast if there's an error and no projects data (only once)
  useEffect(() => {
    if (error && projects.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && projects.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Projects</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Projects</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your personal and professional projects
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-6">
          {projects.map((projectItem, index) => (
            <div
              key={projectItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <FolderKanban className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{projectItem.name}</h2>
                      <p className="text-sm text-muted-foreground">{projectItem.tech_stack}</p>
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
                        handleEditProject(projectItem)
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
                        handleDeleteProject(projectItem.id)
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
                        {projectItem.start_date} - {projectItem.end_date}
                      </p>
                    </div>
                  </div>

                  {/* Tech Stack Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Code className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Tech Stack</p>
                      <p className="text-lg font-semibold text-foreground">
                        {projectItem.tech_stack || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Link Section */}
                  {projectItem.link && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <LinkIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {projectItem.link_label || 'Link'}
                        </p>
                        <a
                          href={projectItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate block"
                        >
                          {projectItem.link}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Subpoints Section */}
                  {projectItem.subpoints && projectItem.subpoints.length > 0 && (
                    <div className="flex items-start gap-4">
                      <FolderKanban className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Subpoints</p>
                        <div className="space-y-2">
                          {projectItem.subpoints.map((subpoint, subpointIndex) => (
                            <div
                              key={subpointIndex}
                              className="group/subpoint p-4 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-md bg-primary/10 group-hover/subpoint:bg-primary/20 transition-colors shrink-0 mt-0.5">
                                  <FolderKanban className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {subpoint.replace(/\\%/g, '%').replace(/\\./g, '.')}
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
              <FolderKanban className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Projects Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your personal and professional projects.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingProjectId(null)
            setOriginalProject(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingProjectId !== null ? 'Edit Project' : 'Add Project'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingProjectId !== null
                ? 'Update your project information.'
                : 'Add a new project with details about your work.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Name Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Project Name</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Project Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., E-commerce Platform"
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

              {/* Tech Stack Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Tech Stack</h3>
                <FormField
                  control={form.control}
                  name="techStack"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Tech Stack</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Node, Express, React, MongoDB"
                          maxLength={100}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 100 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Link Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Link (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Link URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., https://github.com/user/project"
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
                  <FormField
                    control={form.control}
                    name="linkLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Link Label</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., GitHub, GitLab, Live Demo"
                            maxLength={30}
                            disabled={!link || link === ''}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormDescription>
                          Optional. Maximum 30 characters. Allowed: A-Z, a-z, 0-9, spaces. Required if link is provided.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Subpoints Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Subpoints</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubpoint}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subpoint
                  </Button>
                </div>

                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have 1-3 subpoints in each project.
                  </p>
                </div>

                {subpoints.map((_, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Subpoint {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubpoint(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`subpoints.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-3">
                            <FormLabel>Subpoint</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRephraseSubpoint(index)}
                                    disabled={rephrasingSubpointIndex === index || !field.value || !watch('name') || !checkCredits(REPHRASE_COST, credits)}
                                  >
                                    {rephrasingSubpointIndex === index ? (
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
                              placeholder="e.g., Built a scalable e-commerce platform that increased sales by 25%"
                              maxLength={250}
                              rows={3}
                              className="mt-2"
                              disabled={rephrasingSubpointIndex === index}
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

                {subpoints.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No subpoints added. Click "Add Subpoint" to add one.
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingProjectId(null)
                    setOriginalProject(null)
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

export default Projects
