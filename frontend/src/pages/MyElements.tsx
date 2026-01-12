import { 
  Type, 
  GraduationCap, 
  Briefcase, 
  FolderKanban, 
  Code, 
  Award, 
  Trophy, 
  HeartHandshake,
  Upload,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'react-toastify'
import api from '@/api/axios'
import { ExtractedResumeReviewDialog } from '@/components/resume-extraction/ExtractedResumeReviewDialog'
import type { ExtractedResumeData } from '@/components/resume-extraction/types'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { EXTRACT_RESUME_COST } from '@/utils/paymentConstants'
import { checkCredits, getCreditErrorMessage, handleCreditError, updateCreditsAfterOperation } from '@/utils/creditUtils'

const MyElements = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const credits = useSelector((state: RootState) => state.auth.credits)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Review dialog state
  const [extractedData, setExtractedData] = useState<ExtractedResumeData | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const elements = [
    {
      id: 'heading',
      title: 'Heading',
      description: 'Mobile number, Custom links',
      icon: Type,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Institution, Location, Degree, GPA, Dates, Courses',
      icon: GraduationCap,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      id: 'experience',
      title: 'Experience',
      description: 'Company, Location, Position, Dates, Projects',
      icon: Briefcase,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      id: 'projects',
      title: 'Projects',
      description: 'Name, Date range, Tech stack, GitHub link, Subpoints',
      icon: FolderKanban,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
    {
      id: 'skills',
      title: 'Skills',
      description: 'Category, Items (Languages, Frameworks, Tools, etc.)',
      icon: Code,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      id: 'certifications',
      title: 'Certifications',
      description: 'Title, Date range, Instructor, Platform, Link',
      icon: Award,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    },
    {
      id: 'awards',
      title: 'Awards',
      description: 'Title, Date',
      icon: Trophy,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    },
    {
      id: 'volunteer',
      title: 'Volunteer Experiences',
      description: 'Organization, Location, Description, Dates',
      icon: HeartHandshake,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    },
  ]

  const handleCardClick = (elementId: string) => {
    // Navigate to the specific element section
    const routes: Record<string, string> = {
      heading: '/my-elements/heading',
      education: '/my-elements/education',
      experience: '/my-elements/experience',
      projects: '/my-elements/projects',
      skills: '/my-elements/skills',
      certifications: '/my-elements/certifications',
      awards: '/my-elements/awards',
      volunteer: '/my-elements/volunteer',
    }

    const route = routes[elementId]
    if (route) {
      navigate(route)
    } else {
      console.log(`Route for ${elementId} not yet implemented`)
    }
  }

  const handleOpenUploadDialog = () => {
    setIsUploadDialogOpen(true)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file')
        return
      }
      
      // Validate file size (e.g., max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first')
      return
    }

    // Check credits before proceeding
    if (!checkCredits(EXTRACT_RESUME_COST, credits)) {
      toast.error(getCreditErrorMessage(EXTRACT_RESUME_COST, credits))
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await api.post('/api/ai/extract-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('Response:', response.data)
      
      // Update credits after successful extraction
      updateCreditsAfterOperation(response, dispatch, credits, EXTRACT_RESUME_COST)
      
      // Store extracted data and PDF URL
      if (response.data?.extracted_data) {
        setExtractedData(response.data.extracted_data)
        // Store PDF URL from response (could be pdf_url, resume_url, or file_url)
        // Fallback to previewUrl (blob URL) if API doesn't return a URL
        const url = response.data.pdf_url || response.data.resume_url || response.data.file_url || previewUrl || null
        setPdfUrl(url)
        // Close upload dialog but don't revoke previewUrl yet (we'll use it in review dialog)
        setIsUploadDialogOpen(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsReviewDialogOpen(true)
      } else {
        toast.error('No extracted data found in response')
      }
    } catch (error: any) {
      console.error('Error:', error)
      // Handle credit errors specifically
      if (error.response?.status === 400 && 
          (error.response?.data?.detail?.toLowerCase().includes('insufficient credits') ||
           error.response?.data?.detail?.toLowerCase().includes('credit'))) {
        handleCreditError(error, dispatch, navigate)
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to upload resume'
        toast.error(errorMessage)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseReviewDialog = () => {
    setIsReviewDialogOpen(false)
    setExtractedData(null)
    setPdfUrl(null)
    // Now clean up the file and preview URL
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // Parse phone number from format +91-827-4925-985
  const parsePhoneNumber = (mobile: string | null): { countryCode: string; phoneNumber: string } => {
    if (!mobile) return { countryCode: '+91', phoneNumber: '' }
    
    const parts = mobile.split('-')
    if (parts.length >= 4) {
      const countryCode = parts[0] // +91
      const phoneNumber = parts.slice(1).join('').replace(/\D/g, '')
      return { countryCode, phoneNumber }
    }
    return { countryCode: '+91', phoneNumber: '' }
  }

  // Format phone number for backend: +91-827-4925-985
  const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length !== 10) return ''
    return `${countryCode}-${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Elements</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your resume elements. Click on a card to view, add, edit, or update data.
          </p>
          <Button
            variant="default"
            className="w-full sm:w-auto shrink-0"
            onClick={handleOpenUploadDialog}
            disabled={!checkCredits(EXTRACT_RESUME_COST, credits)}
            title={!checkCredits(EXTRACT_RESUME_COST, credits) ? getCreditErrorMessage(EXTRACT_RESUME_COST, credits) : ''}
          >
            Add From Resume ({EXTRACT_RESUME_COST} credits)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {elements.map((element) => {
          const Icon = element.icon
          return (
            <Button
              key={element.id}
              variant="ghost"
              className={`h-auto p-6 flex flex-col items-start gap-4 border-2 border-border hover:border-primary/50 transition-all duration-200 ${element.bgColor} hover:shadow-lg overflow-visible`}
              onClick={() => handleCardClick(element.id)}
            >
              <div className={`p-3 rounded-lg ${element.bgColor} border border-border/50`}>
                <Icon className={`h-6 w-6 ${element.color}`} />
              </div>
              <div className="flex-1 w-full text-left min-w-0">
                <h3 className="text-lg font-semibold mb-2">{element.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed wrap-break-word whitespace-normal">
                  {element.description}
                </p>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Upload Resume Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseUploadDialog()
        } else {
          setIsUploadDialogOpen(true)
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Upload your resume PDF to extract and populate your resume elements automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF only (MAX. 10MB)</p>
                  </div>
                  <input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium flex-1 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>

            {/* PDF Preview Section */}
            {previewUrl && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Preview (First Page)</h3>
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <iframe
                    src={`${previewUrl}#page=1`}
                    className="w-full h-[500px]"
                    title="PDF Preview"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseUploadDialog}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Extracted Resume Dialog */}
      {extractedData && (
        <ExtractedResumeReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          extractedData={extractedData}
          onClose={handleCloseReviewDialog}
          parsePhoneNumber={parsePhoneNumber}
          formatPhoneNumber={formatPhoneNumber}
          pdfUrl={pdfUrl}
        />
      )}
    </div>
  )
}

export default MyElements
