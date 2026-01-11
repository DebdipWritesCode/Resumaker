import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import {
  Type,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Code,
  Award,
  Trophy,
  HeartHandshake,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  FileText,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select'
import { customResumeApi, type CustomResume, type UserElementsResponse } from '@/api/custom-resume'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'

const resumeSchema = z.object({
  name: z.string().min(1, 'Resume name is required'),
})

type ResumeFormValues = z.infer<typeof resumeSchema>

interface ElementSelection {
  heading_ids: string[]
  education_ids: string[]
  experience_ids: string[]
  project_ids: string[]
  skill_ids: string[]
  volunteer_ids: string[]
  certification_ids: string[]
  award_ids: string[]
}

const tabs = [
  { id: 'heading', label: 'Heading', icon: Type },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'volunteers', label: 'Volunteers', icon: HeartHandshake },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'awards', label: 'Awards', icon: Trophy },
]

const MakeResume = () => {
  const [resumes, setResumes] = useState<CustomResume[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResume, setEditingResume] = useState<CustomResume | null>(null)
  const [userElements, setUserElements] = useState<UserElementsResponse | null>(null)
  const [loadingElements, setLoadingElements] = useState(false)
  const [activeTab, setActiveTab] = useState('heading')
  const [selectedElements, setSelectedElements] = useState<ElementSelection>({
    heading_ids: [],
    education_ids: [],
    experience_ids: [],
    project_ids: [],
    skill_ids: [],
    volunteer_ids: [],
    certification_ids: [],
    award_ids: [],
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      name: '',
    },
  })

  // Fetch all resumes
  const fetchResumes = async () => {
    try {
      setLoading(true)
      const data = await customResumeApi.getAllResumes()
      setResumes(data)
    } catch (error: any) {
      console.error('Error fetching resumes:', error)
      toast.error(error.response?.data?.detail || 'Failed to fetch resumes')
    } finally {
      setLoading(false)
    }
  }

  // Fetch user elements
  const fetchUserElements = async () => {
    try {
      setLoadingElements(true)
      const data = await customResumeApi.getUserElements()
      setUserElements(data)
    } catch (error: any) {
      console.error('Error fetching user elements:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error config:', error.config)
      
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch your elements. Please ensure you have created some resume elements first.'
      
      // Only show toast for non-400 errors (400 might be expected if endpoint doesn't exist yet)
      if (error.response?.status !== 400) {
        toast.error(errorMessage)
      } else {
        console.warn('400 Bad Request - The user-elements endpoint may not be implemented yet on the backend')
      }
      
      // Set empty elements to prevent UI from breaking
      setUserElements({
        headings: [],
        educations: [],
        experiences: [],
        projects: [],
        skills: [],
        volunteers: [],
        certifications: [],
        awards: [],
      })
    } finally {
      setLoadingElements(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  // Open dialog for new resume
  const handleCreate = async () => {
    setEditingResume(null)
    form.reset({ name: '' })
    setSelectedElements({
      heading_ids: [],
      education_ids: [],
      experience_ids: [],
      project_ids: [],
      skill_ids: [],
      volunteer_ids: [],
      certification_ids: [],
      award_ids: [],
    })
    setActiveTab('heading')
    setIsDialogOpen(true)
    await fetchUserElements()
  }

  // Open dialog for editing
  const handleEdit = async (resume: CustomResume) => {
    setEditingResume(resume)
    form.reset({ name: resume.name })
    // Convert element IDs to strings (they come as numbers from element APIs)
    setSelectedElements({
      heading_ids: resume.headings.map((h) => String(h.id)),
      education_ids: resume.educations.map((e) => String(e.id)),
      experience_ids: resume.experiences.map((e) => String(e.id)),
      project_ids: resume.projects.map((p) => String(p.id)),
      skill_ids: resume.skills.map((s) => String(s.id)),
      volunteer_ids: resume.volunteers.map((v) => String(v.id)),
      certification_ids: resume.certifications.map((c) => String(c.id)),
      award_ids: resume.awards.map((a) => String(a.id)),
    })
    setActiveTab('heading')
    setIsDialogOpen(true)
    await fetchUserElements()
  }

  // Handle save (create or update)
  const handleSave = async (data: ResumeFormValues) => {
    // Validate that at least one element is selected
    const hasElements = Object.values(selectedElements).some((ids) => ids.length > 0)
    if (!hasElements) {
      toast.error('Please select at least one element for your resume')
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: data.name,
        heading_ids: selectedElements.heading_ids,
        education_ids: selectedElements.education_ids,
        experience_ids: selectedElements.experience_ids,
        project_ids: selectedElements.project_ids,
        skill_ids: selectedElements.skill_ids,
        volunteer_ids: selectedElements.volunteer_ids,
        certification_ids: selectedElements.certification_ids,
        award_ids: selectedElements.award_ids,
      }

      if (editingResume) {
        await customResumeApi.updateResume(editingResume.id, payload)
        toast.success('Resume updated successfully')
      } else {
        await customResumeApi.createResume(payload)
        toast.success('Resume created successfully')
      }

      setIsDialogOpen(false)
      await fetchResumes()
    } catch (error: any) {
      console.error('Error saving resume:', error)
      toast.error(error.response?.data?.detail || 'Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(resumeId)
      await customResumeApi.deleteResume(resumeId)
      toast.success('Resume deleted successfully')
      await fetchResumes()
    } catch (error: any) {
      console.error('Error deleting resume:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete resume')
    } finally {
      setDeletingId(null)
    }
  }

  // Format element labels for display
  const formatElementLabel = (type: string, element: any): string => {
    switch (type) {
      case 'heading':
        const mobile = element.mobile || 'No mobile'
        const linksCount = element.custom_links?.length || 0
        return `Heading: ${mobile}, ${linksCount} link${linksCount !== 1 ? 's' : ''}`
      case 'education':
        return `${element.institution} - ${element.degree}`
      case 'experience':
        return `${element.company} - ${element.position}`
      case 'projects':
        return element.name
      case 'skills':
        return element.category
      case 'volunteers':
        return `${element.organization} - ${element.position}`
      case 'certifications':
        return `${element.title} - ${element.platform}`
      case 'awards':
        return element.title
      default:
        return String(element.id)
    }
  }

  // Format element description for display
  const formatElementDescription = (type: string, element: any): string => {
    switch (type) {
      case 'heading':
        const links = element.custom_links?.map((l: any) => l.label).join(', ') || 'No links'
        return `Links: ${links}`
      case 'education':
        return `${element.location} • ${element.start_date} - ${element.end_date}${element.gpa ? ` • GPA: ${element.gpa}` : ''}`
      case 'experience':
        return `${element.location} • ${element.start_date} - ${element.end_date}${element.projects?.length ? ` • ${element.projects.length} project${element.projects.length !== 1 ? 's' : ''}` : ''}`
      case 'projects':
        const techStack = element.tech_stack ? `Tech: ${element.tech_stack}` : ''
        const subpointsCount = element.subpoints?.length || 0
        const hasLink = element.link ? 'Has GitHub/Link' : ''
        const details = [techStack, subpointsCount > 0 ? `${subpointsCount} subpoint${subpointsCount !== 1 ? 's' : ''}` : '', hasLink].filter(Boolean).join(' • ')
        return `${element.start_date} - ${element.end_date}${details ? ` • ${details}` : ''}`
      case 'skills':
        return `${element.items?.length || 0} skill${(element.items?.length || 0) !== 1 ? 's' : ''}: ${element.items?.slice(0, 3).join(', ') || 'None'}${element.items?.length > 3 ? '...' : ''}`
      case 'volunteers':
        return `${element.location} • ${element.start_date} - ${element.end_date}`
      case 'certifications':
        return `${element.start_date} - ${element.end_date}${element.instructor ? ` • Instructor: ${element.instructor}` : ''}`
      case 'awards':
        return `Awarded on ${element.date}`
      default:
        return ''
    }
  }

  // Get options for each element type
  const getElementOptions = (type: string): MultiSelectOption[] => {
    if (!userElements) return []

    switch (type) {
      case 'heading':
        return userElements.headings.map((h) => ({
          value: String(h.id),
          label: formatElementLabel('heading', h),
          description: formatElementDescription('heading', h),
          details: {
            mobile: h.mobile || 'Not provided',
            links: h.custom_links?.length || 0,
          },
        }))
      case 'education':
        return userElements.educations.map((e) => ({
          value: String(e.id),
          label: formatElementLabel('education', e),
          description: formatElementDescription('education', e),
          details: {
            location: e.location,
            gpa: e.gpa ? `${e.gpa}${e.max_gpa ? ` / ${e.max_gpa}` : ''}` : null,
            courses: e.courses?.length || 0,
          },
        }))
      case 'experience':
        return userElements.experiences.map((e) => ({
          value: String(e.id),
          label: formatElementLabel('experience', e),
          description: formatElementDescription('experience', e),
          details: {
            location: e.location,
            projects: e.projects?.length || 0,
          },
        }))
      case 'projects':
        return userElements.projects.map((p) => ({
          value: String(p.id),
          label: formatElementLabel('projects', p),
          description: formatElementDescription('projects', p),
          details: {
            tech_stack: p.tech_stack,
            link: p.link ? 'Has link' : null,
            subpoints: p.subpoints?.length || 0,
          },
        }))
      case 'skills':
        return userElements.skills.map((s) => ({
          value: String(s.id),
          label: formatElementLabel('skills', s),
          description: formatElementDescription('skills', s),
          details: {
            items_count: s.items?.length || 0,
          },
        }))
      case 'volunteers':
        return userElements.volunteers.map((v) => ({
          value: String(v.id),
          label: formatElementLabel('volunteers', v),
          description: formatElementDescription('volunteers', v),
          details: {
            location: v.location,
            description: v.description ? (v.description.length > 50 ? v.description.substring(0, 50) + '...' : v.description) : null,
          },
        }))
      case 'certifications':
        return userElements.certifications.map((c) => ({
          value: String(c.id),
          label: formatElementLabel('certifications', c),
          description: formatElementDescription('certifications', c),
          details: {
            platform: c.platform,
            instructor: c.instructor || null,
          },
        }))
      case 'awards':
        return userElements.awards.map((a) => ({
          value: String(a.id),
          label: formatElementLabel('awards', a),
          description: formatElementDescription('awards', a),
        }))
      default:
        return []
    }
  }

  // Get selected IDs for current tab
  const getSelectedIds = (type: string): string[] => {
    switch (type) {
      case 'heading':
        return selectedElements.heading_ids
      case 'education':
        return selectedElements.education_ids
      case 'experience':
        return selectedElements.experience_ids
      case 'projects':
        return selectedElements.project_ids
      case 'skills':
        return selectedElements.skill_ids
      case 'volunteers':
        return selectedElements.volunteer_ids
      case 'certifications':
        return selectedElements.certification_ids
      case 'awards':
        return selectedElements.award_ids
      default:
        return []
    }
  }

  // Handle element selection change
  const handleElementChange = (type: string, selected: string[]) => {
    // Map tab IDs to state keys (some are plural in tabs but singular in state)
    const stateKeyMap: Record<string, keyof ElementSelection> = {
      'heading': 'heading_ids',
      'education': 'education_ids',
      'experience': 'experience_ids',
      'projects': 'project_ids',
      'skills': 'skill_ids',
      'volunteers': 'volunteer_ids',
      'certifications': 'certification_ids',
      'awards': 'award_ids',
    }
    
    const stateKey = stateKeyMap[type]
    if (!stateKey) {
      console.error(`Unknown element type: ${type}`)
      return
    }
    
    setSelectedElements((prev) => ({
      ...prev,
      [stateKey]: selected,
    }))
  }

  // Get element count for resume card
  const getElementCounts = (resume: CustomResume): string => {
    const counts: string[] = []
    if (resume.headings.length > 0) counts.push(`${resume.headings.length} Heading${resume.headings.length !== 1 ? 's' : ''}`)
    if (resume.educations.length > 0) counts.push(`${resume.educations.length} Education${resume.educations.length !== 1 ? 's' : ''}`)
    if (resume.experiences.length > 0) counts.push(`${resume.experiences.length} Experience${resume.experiences.length !== 1 ? 's' : ''}`)
    if (resume.projects.length > 0) counts.push(`${resume.projects.length} Project${resume.projects.length !== 1 ? 's' : ''}`)
    if (resume.skills.length > 0) counts.push(`${resume.skills.length} Skill${resume.skills.length !== 1 ? 's' : ''}`)
    if (resume.volunteers.length > 0) counts.push(`${resume.volunteers.length} Volunteer${resume.volunteers.length !== 1 ? 's' : ''}`)
    if (resume.certifications.length > 0) counts.push(`${resume.certifications.length} Certification${resume.certifications.length !== 1 ? 's' : ''}`)
    if (resume.awards.length > 0) counts.push(`${resume.awards.length} Award${resume.awards.length !== 1 ? 's' : ''}`)
    return counts.length > 0 ? counts.join(', ') : 'No elements'
  }

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch {
      return dateString
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Make Resume</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            Create and manage your custom resumes by selecting from your resume elements
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Resume
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first custom resume by clicking the "New Resume" button
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow bg-card w-full max-w-full overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base sm:text-lg font-semibold truncate mb-1">{resume.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {getElementCounts(resume)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                <p>Created: {formatDate(resume.created_at)}</p>
                {resume.updated_at !== resume.created_at && (
                  <p>Updated: {formatDate(resume.updated_at)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(resume)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(resume.id)}
                  disabled={deletingId === resume.id}
                >
                  {deletingId === resume.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">Delete</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 sm:px-3"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        // TODO: Implement download PDF
                        toast.info('Download PDF feature coming soon')
                      }}
                    >
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        // TODO: Implement download LaTeX
                        toast.info('Download LaTeX feature coming soon')
                      }}
                    >
                      Download LaTeX
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingResume ? 'Edit Resume' : 'Create New Resume'}</DialogTitle>
            <DialogDescription>
              Select elements from your resume to include in this custom resume
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col flex-1 min-h-0">
              <div className="space-y-4 mb-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resume Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Software Engineer Resume" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tabs */}
              <div className="w-full bg-background border-b mb-4">
                <div className="px-2 overflow-x-auto custom-scrollbar">
                  <div className="flex gap-2 min-w-max py-2">
                    {tabs.map((tab) => {
                      const TabIcon = tab.icon
                      const isActive = activeTab === tab.id
                      const selectedCount = getSelectedIds(tab.id).length

                      return (
                        <Button
                          key={tab.id}
                          type="button"
                          variant={isActive ? 'default' : 'ghost'}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'flex items-center gap-2 whitespace-nowrap transition-colors',
                            isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                          )}
                        >
                          <TabIcon className="h-4 w-4 shrink-0" />
                          <span className="text-sm">{tab.label}</span>
                          {selectedCount > 0 && (
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded-full text-xs font-medium',
                                isActive
                                  ? 'bg-primary-foreground/20 text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {selectedCount}
                            </span>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
                {loadingElements ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                        {activeTab === 'heading' ? 'Select Heading (Maximum 1)' : `Select ${tabs.find((t) => t.id === activeTab)?.label}`}
                      </label>
                      <MultiSelect
                        options={getElementOptions(activeTab)}
                        selected={getSelectedIds(activeTab)}
                        onChange={(selected) => handleElementChange(activeTab, selected)}
                        placeholder={`Select ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
                        maxSelections={activeTab === 'heading' ? 1 : undefined}
                        searchable={true}
                      />
                      {activeTab === 'heading' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          You can only select one heading per resume
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Coming soon"
                >
                  Compile
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingResume ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingResume ? 'Update Resume' : 'Create Resume'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MakeResume
