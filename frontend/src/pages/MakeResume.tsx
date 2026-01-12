import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '@/store'
import { DndContext, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
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
  Download,
  FileCode,
  Link2,
  Check,
  Sparkles,
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
import { Textarea } from '@/components/ui/textarea'
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select'
import { SortableSelectedItems } from '@/components/resume/SortableSelectedItems'
import { customResumeApi, type CustomResume, type UserElementsResponse } from '@/api/custom-resume'
import { toast } from 'react-toastify'
import { cn } from '../../lib/utils'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { SELECT_ELEMENTS_COST } from '@/utils/paymentConstants'
import { checkCredits, getCreditErrorMessage, handleCreditError, updateCreditsAfterOperation } from '@/utils/creditUtils'

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
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const maxResume = useSelector((state: RootState) => state.auth.max_resume)
  const credits = useSelector((state: RootState) => state.auth.credits)
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [copiedResumeId, setCopiedResumeId] = useState<string | null>(null)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [isSelectingWithAi, setIsSelectingWithAi] = useState(false)

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

  // Check if user can create more resumes
  const canCreateMore = maxResume === null || resumes.length < maxResume

  // Open dialog for new resume
  const handleCreate = async () => {
    // Check if user has reached the limit
    if (!canCreateMore) {
      toast.error(
        `You have reached your resume limit (${maxResume} resumes). Buy a new slot to create more resumes.`
      )
      navigate('/payments')
      return
    }

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
    setPdfPreviewUrl(null) // Clear previous PDF preview
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
    setPdfPreviewUrl(null) // Clear previous PDF preview
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

      let pdfBlob: Blob
      if (editingResume) {
        pdfBlob = await customResumeApi.updateResume(editingResume.id, payload)
        toast.success('Resume updated and compiled successfully')
      } else {
        pdfBlob = await customResumeApi.createResume(payload)
        toast.success('Resume created and compiled successfully')
      }

      // Create blob URL for PDF preview
      const pdfUrl = URL.createObjectURL(pdfBlob)
      setPdfPreviewUrl(pdfUrl)

      // Refresh resume list to get updated data
      await fetchResumes()
    } catch (error: any) {
      console.error('Error saving resume:', error)
      toast.error(error.response?.data?.detail || 'Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  // Clean up PDF preview URL when dialog closes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  // Handle AI selection
  const handleAiSelection = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description')
      return
    }

    // Check credits before proceeding
    if (!checkCredits(SELECT_ELEMENTS_COST, credits)) {
      toast.error(getCreditErrorMessage(SELECT_ELEMENTS_COST, credits))
      return
    }

    try {
      setIsSelectingWithAi(true)
      const response = await customResumeApi.selectElements({
        job_description: jobDescription.trim(),
      })

      // Update credits after successful selection
      updateCreditsAfterOperation(response, dispatch, credits, SELECT_ELEMENTS_COST)

      // Update selected elements by replacing (not merging) the four categories
      setSelectedElements((prev) => ({
        ...prev,
        project_ids: response.project_ids,
        award_ids: response.award_ids,
        certification_ids: response.certification_ids,
        volunteer_ids: response.volunteer_ids,
      }))

      // Calculate total elements selected
      const totalElements =
        response.project_ids.length +
        response.award_ids.length +
        response.certification_ids.length +
        response.volunteer_ids.length

      toast.success(
        `AI selected ${totalElements} elements`
      )

      // Close AI dialog
      setIsAiDialogOpen(false)
      setJobDescription('')
    } catch (error: any) {
      console.error('Error selecting elements with AI:', error)
      // Handle credit errors specifically
      if (error.response?.status === 400 && 
          (error.response?.data?.detail?.toLowerCase().includes('insufficient credits') ||
           error.response?.data?.detail?.toLowerCase().includes('credit'))) {
        handleCreditError(error, dispatch, navigate)
      } else {
        const errorMessage =
          error.response?.data?.detail ||
          'Failed to select elements with AI. Please try again.'
        toast.error(errorMessage)
      }
    } finally {
      setIsSelectingWithAi(false)
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
        const itemsText = `${element.items?.length || 0} skill${(element.items?.length || 0) !== 1 ? 's' : ''}: ${element.items?.slice(0, 3).join(', ') || 'None'}${element.items?.length > 3 ? '...' : ''}`
        const notesText = element.notes ? ` • Notes: ${element.notes}` : ''
        return itemsText + notesText
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
        return userElements.skills.map((s) => {
          const details: Record<string, any> = {}
          // Prioritize notes if they exist
          if (s.notes) {
            details.notes = s.notes
          }
          details.items_count = s.items?.length || 0
          return {
            value: String(s.id),
            label: formatElementLabel('skills', s),
            description: formatElementDescription('skills', s),
            details,
          }
        })
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

  // Handle drag end for reordering selected items
  const handleDragEnd = (event: DragEndEvent, type: string) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const selectedIds = getSelectedIds(type)
    const oldIndex = selectedIds.indexOf(String(active.id))
    const newIndex = selectedIds.indexOf(String(over.id))

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(selectedIds, oldIndex, newIndex)
      handleElementChange(type, newOrder)
    }
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
          {!canCreateMore && maxResume !== null && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You have reached your resume limit ({maxResume} resumes).{' '}
                <button
                  onClick={() => navigate('/payments')}
                  className="underline font-semibold hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  Buy a new slot
                </button>{' '}
                to create more resumes.
              </p>
            </div>
          )}
        </div>
        <Button
          onClick={handleCreate}
          className="w-full sm:w-auto"
          disabled={!canCreateMore}
        >
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
              {/* Thumbnail */}
              {resume.thumbnail_url && (
                <div className="mb-4 rounded-lg overflow-hidden border bg-muted/30">
                  <img
                    src={resume.thumbnail_url}
                    alt={`${resume.name} thumbnail`}
                    className="w-full h-48 sm:h-64 object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base sm:text-lg font-semibold truncate mb-1">{resume.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground wrap-break-word">
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
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={async () => {
                        if (resume.pdf_url) {
                          try {
                            const link = document.createElement('a')
                            link.href = resume.pdf_url
                            link.download = `${resume.name}.pdf`
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            toast.success('PDF download started')
                          } catch (error) {
                            console.error('Error downloading PDF:', error)
                            toast.error('Failed to download PDF')
                          }
                        } else {
                          toast.error('PDF not available for this resume')
                        }
                      }}
                      disabled={!resume.pdf_url}
                      className="cursor-pointer"
                    >
                      <Download className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Download PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (resume.latex_url) {
                          try {
                            const link = document.createElement('a')
                            link.href = resume.latex_url
                            link.download = `${resume.name}.tex`
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            toast.success('LaTeX file download started')
                          } catch (error) {
                            console.error('Error downloading LaTeX:', error)
                            toast.error('Failed to download LaTeX file')
                          }
                        } else {
                          toast.error('LaTeX file not available for this resume')
                        }
                      }}
                      disabled={!resume.latex_url}
                      className="cursor-pointer"
                    >
                      <FileCode className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Download LaTeX</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          const publicUrl = `${window.location.origin}/resume/${resume.id}`
                          await navigator.clipboard.writeText(publicUrl)
                          setCopiedResumeId(resume.id)
                          toast.success('Public link copied to clipboard!')
                          // Reset the copied state after 2 seconds
                          setTimeout(() => {
                            setCopiedResumeId(null)
                          }, 2000)
                        } catch (error) {
                          console.error('Error copying to clipboard:', error)
                          // Fallback for browsers that don't support clipboard API
                          const publicUrl = `${window.location.origin}/resume/${resume.id}`
                          const textArea = document.createElement('textarea')
                          textArea.value = publicUrl
                          textArea.style.position = 'fixed'
                          textArea.style.opacity = '0'
                          document.body.appendChild(textArea)
                          textArea.select()
                          try {
                            document.execCommand('copy')
                            setCopiedResumeId(resume.id)
                            toast.success('Public link copied to clipboard!')
                            setTimeout(() => {
                              setCopiedResumeId(null)
                            }, 2000)
                          } catch (err) {
                            toast.error('Failed to copy link')
                          }
                          document.body.removeChild(textArea)
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {copiedResumeId === resume.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2 text-orange-500" />
                          <span>Copy Public Link</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Clean up PDF preview URL when dialog closes
            if (pdfPreviewUrl) {
              URL.revokeObjectURL(pdfPreviewUrl)
              setPdfPreviewUrl(null)
            }
          }
          setIsDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>{editingResume ? 'Edit Resume' : 'Create New Resume'}</DialogTitle>
            <DialogDescription>
              Select elements from your resume to include in this custom resume
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAiDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={!checkCredits(SELECT_ELEMENTS_COST, credits)}
              title={!checkCredits(SELECT_ELEMENTS_COST, credits) ? getCreditErrorMessage(SELECT_ELEMENTS_COST, credits) : ''}
            >
              <Sparkles className="h-4 w-4" />
              <span>Select with AI</span>
              <span className="text-xs text-muted-foreground ml-1">({SELECT_ELEMENTS_COST} credits)</span>
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 min-h-0">
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
                <div className="w-full bg-background border-b mb-4 -mx-6 px-6">
                  <div className="overflow-x-auto custom-scrollbar">
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
                <div className="min-h-[300px] pb-4">
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

                      {/* Sortable Selected Items */}
                      {getSelectedIds(activeTab).length > 0 && (
                        <DndContext
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, activeTab)}
                        >
                          <SortableContext
                            items={getSelectedIds(activeTab)}
                            strategy={verticalListSortingStrategy}
                          >
                            <SortableSelectedItems
                              selectedIds={getSelectedIds(activeTab)}
                              options={getElementOptions(activeTab)}
                            />
                          </SortableContext>
                        </DndContext>
                      )}

                      {/* PDF Preview Section */}
                      {pdfPreviewUrl && (
                        <div className="space-y-2 mt-6 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">PDF Preview</h3>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = pdfPreviewUrl
                                link.download = `${form.getValues('name') || 'resume'}.pdf`
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                          <div className="border rounded-lg overflow-hidden bg-muted/30">
                            <iframe
                              src={`${pdfPreviewUrl}#page=1`}
                              className="w-full h-[500px] sm:h-[600px]"
                              title="PDF Preview"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <DialogFooter className="px-6 py-4 border-t shrink-0 mt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (pdfPreviewUrl) {
                      URL.revokeObjectURL(pdfPreviewUrl)
                      setPdfPreviewUrl(null)
                    }
                    setIsDialogOpen(false)
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingResume ? 'Updating and Compiling...' : 'Creating and Compiling...'}
                    </>
                  ) : (
                    editingResume ? 'Update and Compile' : 'Save and Compile'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AI Selection Dialog */}
      <Dialog
        open={isAiDialogOpen}
        onOpenChange={(open) => {
          setIsAiDialogOpen(open)
          if (!open) {
            setJobDescription('')
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Select Elements with AI
            </DialogTitle>
            <DialogDescription>
              Enter a job description and AI will automatically select the most relevant projects, awards, certifications, and volunteer experiences for your resume. This operation costs {SELECT_ELEMENTS_COST} credits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                Job Description
              </label>
              <Textarea
                placeholder="Paste or type the job description here...&#10;&#10;Example: We are looking for a Full Stack Developer with experience in React, Node.js, and MongoDB. The ideal candidate should have experience building scalable web applications and working with cloud services."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[150px] resize-y"
                disabled={isSelectingWithAi}
              />
              <p className="text-xs text-muted-foreground mt-2">
                The AI will analyze the job description and select up to 3 projects, 3-4 awards, 2 certifications, and 2 volunteer experiences that best match the requirements.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAiDialogOpen(false)
                setJobDescription('')
              }}
              disabled={isSelectingWithAi}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAiSelection}
              disabled={isSelectingWithAi || !jobDescription.trim() || !checkCredits(SELECT_ELEMENTS_COST, credits)}
              title={!checkCredits(SELECT_ELEMENTS_COST, credits) ? getCreditErrorMessage(SELECT_ELEMENTS_COST, credits) : ''}
            >
              {isSelectingWithAi ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Selecting Elements...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Select Elements ({SELECT_ELEMENTS_COST} credits)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MakeResume
