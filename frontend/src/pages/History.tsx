import { useState, useEffect, useMemo } from 'react'
import { FileText, Download, X, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/api/axios'
import { toast } from 'react-toastify'
import type { UploadedResumeResponse } from '@/types/history'
import { cn } from '@/lib/utils'

// Helper function to convert UTC date string to local timezone
const formatLocalDateTime = (utcDateString: string): string => {
  try {
    // Parse the UTC date string - JavaScript automatically converts to local timezone
    const date = new Date(utcDateString)
    
    // Verify the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', utcDateString)
      return 'Invalid date'
    }
    
    // Use date-fns format with the Date object
    // The Date object already represents local time, so format() will display local time
    // Example: UTC "2026-01-11T05:35:04.632+00:00" → Local "January 11th, 2026 at 11:05 AM" (IST)
    return format(date, "PPP 'at' p")
  } catch (error) {
    console.error('Error formatting date:', error, utcDateString)
    return 'Invalid date'
  }
}

const History = () => {
  const [resumes, setResumes] = useState<UploadedResumeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResume, setSelectedResume] = useState<UploadedResumeResponse | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'json'>('details')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)

  // Fetch uploaded resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true)
        const response = await api.get('/api/ai/uploaded-resumes')
        setResumes(response.data || [])
      } catch (error: any) {
        console.error('Error fetching resumes:', error)
        toast.error(error.response?.data?.detail || 'Failed to fetch uploaded resumes')
      } finally {
        setLoading(false)
      }
    }

    fetchResumes()
  }, [])

  // Filter resumes by date
  const filteredResumes = useMemo(() => {
    if (!dateFilter) return resumes

    return resumes.filter((resume) => {
      const uploadDate = new Date(resume.uploaded_at)
      return (
        uploadDate.getDate() === dateFilter.getDate() &&
        uploadDate.getMonth() === dateFilter.getMonth() &&
        uploadDate.getFullYear() === dateFilter.getFullYear()
      )
    })
  }, [resumes, dateFilter])

  const handleResumeClick = (resume: UploadedResumeResponse) => {
    setSelectedResume(resume)
    setIsDetailDialogOpen(true)
    setActiveTab('details')
  }

  const handleDownloadJSON = () => {
    if (!selectedResume) return

    const dataStr = JSON.stringify(selectedResume.extracted_data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resume-${selectedResume._id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('JSON file downloaded successfully')
  }

  const clearDateFilter = () => {
    setDateFilter(undefined)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-3xl font-bold">History</h1>
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DatePicker
            date={dateFilter}
            onSelect={setDateFilter}
            placeholder="Filter by date"
            align="start"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDateFilter}
              className="h-10 w-10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading resumes...</p>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            {dateFilter ? 'No resumes found for selected date' : 'No uploaded resumes'}
          </p>
          <p className="text-sm text-muted-foreground">
            {dateFilter
              ? 'Try selecting a different date or clear the filter'
              : 'Upload your first resume from the "My Elements" page'}
          </p>
        </div>
      ) : (
        <>
          {/* Resume Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResumes.map((resume) => (
              <div
                key={resume._id}
                onClick={() => handleResumeClick(resume)}
                className="group cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted">
                  {resume.thumbnail_url ? (
                    <img
                      src={resume.thumbnail_url}
                      alt="Resume thumbnail"
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
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatLocalDateTime(resume.uploaded_at).split(' at ')[0]}
                  </p>
                  <p className="text-sm font-medium line-clamp-2">
                    Resume Upload
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Results Count */}
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Showing {filteredResumes.length} of {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
            {dateFilter && ` filtered by ${format(dateFilter, "PPP")}`}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-4xl xl:max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-xl sm:text-2xl">Resume Details</DialogTitle>
                  <DialogDescription className="mt-2">
                    {selectedResume && formatLocalDateTime(selectedResume.uploaded_at)}
                  </DialogDescription>
                </div>
              </div>
              {selectedResume?.cloudinary_url && (
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedResume.cloudinary_url, '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    See PDF
                  </Button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 border-b">
              <button
                onClick={() => setActiveTab('details')}
                  className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === 'details'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === 'json'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Raw JSON
              </button>
            </div>
          </DialogHeader>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
            {activeTab === 'details' && selectedResume && (
              <ResumeDetailsView data={selectedResume.extracted_data} />
            )}

            {activeTab === 'json' && selectedResume && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Extracted resume data in JSON format
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadJSON}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                  {JSON.stringify(selectedResume.extracted_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component to display resume details in a formatted way
const ResumeDetailsView = ({ data }: { data: UploadedResumeResponse['extracted_data'] }) => {
  return (
    <div className="space-y-6">
      {/* Heading */}
      {data.heading && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Heading</h3>
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            {data.heading.mobile && (
              <p><span className="font-medium">Mobile:</span> {data.heading.mobile}</p>
            )}
            {data.heading.custom_links && data.heading.custom_links.length > 0 && (
              <div>
                <span className="font-medium">Links:</span>
                <ul className="list-disc list-inside ml-2">
                  {data.heading.custom_links.map((link, idx) => (
                    <li key={idx}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Experiences */}
      {data.experiences && data.experiences.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Experiences ({data.experiences.length})</h3>
          <div className="space-y-4">
            {data.experiences.map((exp, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">{exp.position}</p>
                <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                <p className="text-sm text-muted-foreground">{exp.start_date} - {exp.end_date}</p>
                {exp.projects && exp.projects.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Projects:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      {exp.projects.map((proj, pIdx) => (
                        <li key={pIdx} className="text-sm">
                          <span className="font-medium">{proj.title}:</span> {proj.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Projects ({data.projects.length})</h3>
          <div className="space-y-4">
            {data.projects.map((proj, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">{proj.name}</p>
                <p className="text-sm text-muted-foreground">{proj.start_date} - {proj.end_date}</p>
                <p className="text-sm text-muted-foreground mt-1">Tech Stack: {proj.tech_stack}</p>
                {proj.link && (
                  <p className="text-sm mt-1">
                    <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {proj.link_label || proj.link}
                    </a>
                  </p>
                )}
                {proj.subpoints && proj.subpoints.length > 0 && (
                  <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                    {proj.subpoints.map((sub, sIdx) => (
                      <li key={sIdx} className="text-sm">{sub}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Education ({data.education.length})</h3>
          <div className="space-y-4">
            {data.education.map((edu, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">{edu.degree}</p>
                <p className="text-sm text-muted-foreground">{edu.institution} • {edu.location}</p>
                <p className="text-sm text-muted-foreground">{edu.start_date} - {edu.end_date}</p>
                {edu.gpa && (
                  <p className="text-sm mt-1">
                    GPA: {edu.gpa}{edu.max_gpa ? ` / ${edu.max_gpa}` : ''}
                  </p>
                )}
                {edu.courses && edu.courses.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Courses:</p>
                    <p className="text-sm">{edu.courses.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Skills ({data.skills.length} categories)</h3>
          <div className="space-y-3">
            {data.skills.map((skill, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold mb-2">{skill.category}</p>
                <p className="text-sm">{skill.items.join(', ')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Certifications ({data.certifications.length})</h3>
          <div className="space-y-4">
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">{cert.title}</p>
                <p className="text-sm text-muted-foreground">{cert.platform}</p>
                <p className="text-sm text-muted-foreground">{cert.start_date} - {cert.end_date}</p>
                {cert.instructor && (
                  <p className="text-sm mt-1">Instructor: {cert.instructor}</p>
                )}
                {cert.certification_link && (
                  <p className="text-sm mt-1">
                    <a href={cert.certification_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      View Certificate
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Awards */}
      {data.awards && data.awards.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Awards ({data.awards.length})</h3>
          <div className="space-y-4">
            {data.awards.map((award, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">{award.title}</p>
                <p className="text-sm text-muted-foreground">{award.date}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Volunteer Experiences */}
      {data.volunteer_experiences && data.volunteer_experiences.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Volunteer Experiences ({data.volunteer_experiences.length})</h3>
          <div className="space-y-4">
            {data.volunteer_experiences.map((vol, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">{vol.position}</p>
                <p className="text-sm text-muted-foreground">{vol.organization} • {vol.location}</p>
                <p className="text-sm text-muted-foreground">{vol.start_date} - {vol.end_date}</p>
                <p className="text-sm mt-2">{vol.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default History
