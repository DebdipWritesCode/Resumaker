import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Coins,
  FileText,
  Sparkles,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Image as ImageIcon,
  Clock,
  Type,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Code,
  Award,
  Trophy,
  HeartHandshake,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
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
import { dashboardApi, type DashboardResponse, type ElementCounts } from '@/api/dashboard'
import { customResumeApi } from '@/api/custom-resume'
import { toast } from 'react-toastify'
import { cn } from '../../lib/utils'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isActivityExpanded, setIsActivityExpanded] = useState(false)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardApi.getDashboard()
      setDashboardData(data)
    } catch (err: any) {
      console.error('Error fetching dashboard:', err)
      setError(err.response?.data?.detail || 'Failed to fetch dashboard data')
      toast.error(err.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleDeleteClick = (id: string, name: string) => {
    setResumeToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return

    try {
      setDeletingId(resumeToDelete.id)
      await customResumeApi.deleteResume(resumeToDelete.id)
      toast.success('Resume deleted successfully')
      setDeleteDialogOpen(false)
      setResumeToDelete(null)
      // Refresh dashboard data
      await fetchDashboard()
    } catch (err: any) {
      console.error('Error deleting resume:', err)
      toast.error(err.response?.data?.detail || 'Failed to delete resume')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadPDF = (url: string, name: string) => {
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `${name}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('PDF download started')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  const formatRelativeTime = (utcDateString: string): string => {
    try {
      const date = new Date(utcDateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'resume_created':
        return FileText
      case 'pdf_generated':
        return Download
      case 'ai_used':
        return Sparkles
      default:
        return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'resume_created':
        return 'text-blue-600 dark:text-blue-400'
      case 'pdf_generated':
        return 'text-green-600 dark:text-green-400'
      case 'ai_used':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const elementRoutes: Record<string, string> = {
    headings: '/my-elements/heading',
    educations: '/my-elements/education',
    experiences: '/my-elements/experience',
    projects: '/my-elements/projects',
    skills: '/my-elements/skills',
    certifications: '/my-elements/certifications',
    awards: '/my-elements/awards',
    volunteers: '/my-elements/volunteer',
  }

  type ElementCountKey = keyof ElementCounts

  const elementConfig: Array<{
    key: ElementCountKey
    label: string
    icon: typeof Type
    color: string
    bgColor: string
  }> = [
    { key: 'headings', label: 'Headings', icon: Type, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/20' },
    { key: 'educations', label: 'Education', icon: GraduationCap, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/20' },
    { key: 'experiences', label: 'Experience', icon: Briefcase, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/20' },
    { key: 'projects', label: 'Projects', icon: FolderKanban, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/20' },
    { key: 'skills', label: 'Skills', icon: Code, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/20' },
    { key: 'certifications', label: 'Certifications', icon: Award, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/20' },
    { key: 'awards', label: 'Awards', icon: Trophy, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20' },
    { key: 'volunteers', label: 'Volunteers', icon: HeartHandshake, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-950/20' },
  ]

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { stats, recent_resumes, recent_pdfs, element_counts, recent_activity } = dashboardData
  const lowCreditsThreshold = 50

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Credits Card */}
        <div
          className={cn(
            'rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50',
            stats.credits < lowCreditsThreshold && 'border-yellow-500 dark:border-yellow-600'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            {stats.credits < lowCreditsThreshold && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/payments')}
                className="text-xs"
              >
                Buy
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.credits}</p>
            <p className="text-sm text-muted-foreground">Credits</p>
            {stats.credits < lowCreditsThreshold && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Low credits - consider buying more
              </p>
            )}
          </div>
        </div>

        {/* Resume Slots Card */}
        <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">
              {stats.resume_count} / {stats.max_resume}
            </p>
            <p className="text-sm text-muted-foreground">Resume Slots</p>
            {stats.resume_count >= stats.max_resume && (
              <p className="text-xs text-muted-foreground mt-2">
                Limit reached
              </p>
            )}
          </div>
        </div>

        {/* PDFs Generated Card */}
        <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.pdfs_generated}</p>
            <p className="text-sm text-muted-foreground">PDFs Generated</p>
          </div>
        </div>

        {/* AI Calls Card */}
        <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.ai_calls_count}</p>
            <p className="text-sm text-muted-foreground">AI Operations</p>
          </div>
        </div>
      </div>

      {/* Recent Resumes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Recent Resumes</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/make-resume')}>
            <FileText className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
        {recent_resumes.length === 0 ? (
          <div className="border rounded-lg p-12 text-center bg-card">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No resumes yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first resume to get started
            </p>
            <Button onClick={() => navigate('/make-resume')}>
              <FileText className="h-4 w-4 mr-2" />
              Create Resume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recent_resumes.map((resume) => (
              <div
                key={resume.id}
                className="group cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                {/* Thumbnail */}
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-t-lg bg-muted">
                  {resume.thumbnail_url ? (
                    <img
                      src={resume.thumbnail_url}
                      alt={resume.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No Preview</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium line-clamp-2 flex-1">{resume.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate('/make-resume')}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/make-resume')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {resume.cloudinary_url && (
                          <DropdownMenuItem
                            onClick={() => handleDownloadPDF(resume.cloudinary_url!, resume.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(resume.id, resume.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(resume.updated_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent PDFs Section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Recent PDFs</h2>
        {recent_pdfs.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-card">
            <Download className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No PDFs generated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent_pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-28 shrink-0 rounded overflow-hidden bg-muted">
                    {pdf.thumbnail_url ? (
                      <img
                        src={pdf.thumbnail_url}
                        alt={pdf.resume_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 line-clamp-2">{pdf.resume_name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {formatRelativeTime(pdf.generated_at)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadPDF(pdf.cloudinary_url, pdf.resume_name)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Recent Activity</h2>
        {recent_activity.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-card">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="border rounded-lg bg-card">
            <div className="divide-y">
              {(isActivityExpanded ? recent_activity : recent_activity.slice(0, 2)).map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                const iconColor = getActivityColor(activity.type)
                return (
                  <div
                    key={index}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors',
                      activity.resume_id && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (activity.resume_id) {
                        navigate('/make-resume')
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      <div className={cn('p-2 rounded-lg bg-muted', iconColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {recent_activity.length > 2 && (
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                >
                  {isActivityExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      See More ({recent_activity.length - 2} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Element Summary */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Element Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {elementConfig.map((config) => {
            const Icon = config.icon
            const count = element_counts[config.key]
            return (
              <Button
                key={config.key}
                variant="ghost"
                className={cn(
                  'h-auto p-4 flex flex-col items-start gap-3 border-2 border-border hover:border-primary/50 transition-all',
                  config.bgColor
                )}
                onClick={() => navigate(elementRoutes[config.key])}
              >
                <div className={cn('p-2 rounded-lg', config.bgColor, 'border border-border/50')}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div className="text-left w-full">
                  <p className="text-2xl font-bold mb-1">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{resumeToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setResumeToDelete(null)
              }}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard
