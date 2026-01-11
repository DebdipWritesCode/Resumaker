import { useState, useEffect, useMemo } from 'react'
import { 
  Type, 
  GraduationCap, 
  Briefcase, 
  FolderKanban, 
  Code, 
  Award, 
  Trophy, 
  HeartHandshake,
  FileText
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExtractedResumeTabs } from './ExtractedResumeTabs'
import { HeadingTab } from './tabs/HeadingTab'
import { ExperiencesTab } from './tabs/ExperiencesTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { EducationTab } from './tabs/EducationTab'
import { SkillsTab } from './tabs/SkillsTab'
import { CertificationsTab } from './tabs/CertificationsTab'
import { AwardsTab } from './tabs/AwardsTab'
import { VolunteerTab } from './tabs/VolunteerTab'
import type { ExtractedResumeData } from './types'
import api from '@/api/axios'
import { toast } from 'react-toastify'

interface ExtractedResumeReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  extractedData: ExtractedResumeData | null
  onClose: () => void
  parsePhoneNumber: (mobile: string | null) => { countryCode: string; phoneNumber: string }
  formatPhoneNumber: (countryCode: string, phoneNumber: string) => string
  pdfUrl?: string | null
}

const tabs = [
  { id: 'heading', label: 'Heading', icon: Type },
  { id: 'experiences', label: 'Experiences', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'awards', label: 'Awards', icon: Trophy },
  { id: 'volunteer', label: 'Volunteer', icon: HeartHandshake },
]

export const ExtractedResumeReviewDialog = ({
  open,
  onOpenChange,
  extractedData,
  onClose,
  parsePhoneNumber,
  formatPhoneNumber,
  pdfUrl
}: ExtractedResumeReviewDialogProps) => {
  const [activeTab, setActiveTab] = useState('heading')
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<ExtractedResumeData | null>(extractedData)

  // Update local data when extractedData prop changes
  useEffect(() => {
    if (extractedData) {
      setData(extractedData)
    }
  }, [extractedData])

  // Validation regex patterns (matching tab validations)
  const companyRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
  const locationRegex = /^[a-zA-Z0-9\s,]+$/
  const positionRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
  const dateRegex = /^[a-zA-Z0-9\s]+$/
  const projectTitleRegex = /^[a-zA-Z0-9\s,]+$/
  const projectDescriptionRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/
  const nameRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
  const titleRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014+&()]+$/
  const institutionRegex = /^[a-zA-Z0-9\s,]+$/
  const degreePartRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014()]+$/
  const courseRegex = /^[a-zA-Z0-9\s,]+$/
  const positionVolRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014&]+$/
  const organizationRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
  const descriptionRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/
  const subpointRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/
  const linkLabelRegex = /^[a-zA-Z0-9\s]+$/
  const platformRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
  const instructorRegex = /^[a-zA-Z\s,]+$/

  // Validate all tabs' data
  const validateAllTabs = (): boolean => {
    if (!data) return false

    // Validate heading
    if (data.heading) {
      const { phoneNumber } = parsePhoneNumber(data.heading.mobile)
      if (phoneNumber && phoneNumber.length !== 10) {
        return false
      }
      if (data.heading.custom_links) {
        for (const link of data.heading.custom_links) {
          if (!link.label || link.label.trim() === '' || link.label.length > 20) return false
          if (!link.url || link.url.trim() === '') return false
          try {
            new URL(link.url)
          } catch {
            return false
          }
        }
      }
    }

    // Validate experiences
    if (data.experiences) {
      for (const exp of data.experiences) {
        if (!exp.company || exp.company.length > 50 || !companyRegex.test(exp.company)) return false
        if (!exp.location || exp.location.length > 60 || !locationRegex.test(exp.location)) return false
        if (!exp.position || exp.position.length > 40 || !positionRegex.test(exp.position)) return false
        if (!exp.start_date || exp.start_date.length > 15 || !dateRegex.test(exp.start_date)) return false
        if (!exp.end_date || exp.end_date.length > 15 || !dateRegex.test(exp.end_date)) return false
        if (exp.projects) {
          for (const proj of exp.projects) {
            if (!proj.title || proj.title.length > 40 || !projectTitleRegex.test(proj.title)) return false
            if (!proj.description || proj.description.length > 250 || !projectDescriptionRegex.test(proj.description)) return false
          }
        }
      }
    }

    // Validate projects
    if (data.projects) {
      for (const proj of data.projects) {
        if (!proj.name || proj.name.length > 100 || !nameRegex.test(proj.name)) return false
        if (!proj.start_date || proj.start_date.length > 15 || !dateRegex.test(proj.start_date)) return false
        if (!proj.end_date || proj.end_date.length > 15 || !dateRegex.test(proj.end_date)) return false
        if (!proj.tech_stack || proj.tech_stack.length > 100) return false
        if (proj.link && proj.link.trim() !== '') {
          try {
            new URL(proj.link)
          } catch {
            return false
          }
          if (!proj.link_label || proj.link_label.length > 30 || !linkLabelRegex.test(proj.link_label)) return false
        }
        if (proj.subpoints) {
          for (const sub of proj.subpoints) {
            if (!sub || sub.length > 250 || !subpointRegex.test(sub)) return false
          }
        }
      }
    }

    // Validate education
    if (data.education) {
      for (const edu of data.education) {
        if (!edu.institution || edu.institution.length > 100 || !institutionRegex.test(edu.institution)) return false
        if (!edu.location || edu.location.length > 50 || !locationRegex.test(edu.location)) return false
        if (!edu.degree || edu.degree.length > 100 || !degreePartRegex.test(edu.degree)) return false
        if (!edu.start_date || edu.start_date.length > 15 || !dateRegex.test(edu.start_date)) return false
        if (!edu.end_date || edu.end_date.length > 15 || !dateRegex.test(edu.end_date)) return false
        if (edu.gpa !== null && edu.gpa !== undefined && edu.gpa !== '') {
          const gpaStr = String(edu.gpa)
          const gpaNum = parseFloat(gpaStr)
          if (isNaN(gpaNum) || gpaNum < 0) return false
          const parts = gpaStr.split('.')
          if (parts.length > 1 && parts[1].length > 2) return false
          if (edu.max_gpa !== null && edu.max_gpa !== undefined && edu.max_gpa !== '') {
            const maxGpaStr = String(edu.max_gpa)
            const maxGpaNum = parseFloat(maxGpaStr)
            if (isNaN(maxGpaNum) || maxGpaNum <= 0) return false
            const maxParts = maxGpaStr.split('.')
            if (maxParts.length > 1 && maxParts[1].length > 2) return false
            if (gpaNum > maxGpaNum) return false
          } else {
            return false // maxGPA required if GPA provided
          }
        }
        if (edu.courses) {
          for (const course of edu.courses) {
            if (!course || course.length > 30 || !courseRegex.test(course)) return false
          }
        }
      }
    }

    // Validate skills
    if (data.skills) {
      for (const skill of data.skills) {
        if (!skill.category || skill.category.trim() === '') return false
        if (skill.items.length === 0) return false
        for (const item of skill.items) {
          if (!item || item.trim() === '') return false
        }
      }
    }

    // Validate certifications
    if (data.certifications) {
      for (const cert of data.certifications) {
        if (!cert.title || cert.title.length > 80 || !titleRegex.test(cert.title)) return false
        if (!cert.start_date || cert.start_date.length > 15 || !dateRegex.test(cert.start_date)) return false
        if (!cert.end_date || cert.end_date.length > 15 || !dateRegex.test(cert.end_date)) return false
        if (!cert.platform || cert.platform.length > 20 || !platformRegex.test(cert.platform)) return false
        if (cert.instructor && cert.instructor.trim() !== '' && !instructorRegex.test(cert.instructor)) return false
        if (cert.certification_link && cert.certification_link.trim() !== '') {
          try {
            new URL(cert.certification_link)
          } catch {
            return false
          }
        }
      }
    }

    // Validate awards
    if (data.awards) {
      for (const award of data.awards) {
        if (!award.title || award.title.length > 120 || !titleRegex.test(award.title)) return false
        if (!award.date || award.date.length > 15 || !dateRegex.test(award.date)) return false
      }
    }

    // Validate volunteer experiences
    if (data.volunteer_experiences) {
      for (const vol of data.volunteer_experiences) {
        if (!vol.position || vol.position.length > 50 || !positionVolRegex.test(vol.position)) return false
        if (!vol.organization || vol.organization.length > 100 || !organizationRegex.test(vol.organization)) return false
        if (!vol.location || vol.location.length > 60 || !locationRegex.test(vol.location)) return false
        if (!vol.description || vol.description.length > 250 || !descriptionRegex.test(vol.description)) return false
        if (!vol.start_date || vol.start_date.length > 15 || !dateRegex.test(vol.start_date)) return false
        if (!vol.end_date || vol.end_date.length > 15 || !dateRegex.test(vol.end_date)) return false
      }
    }

    return true
  }

  // Validate individual tabs
  const validateTab = (tabId: string): boolean => {
    if (!data) return true

    switch (tabId) {
      case 'heading':
        if (data.heading) {
          const { phoneNumber } = parsePhoneNumber(data.heading.mobile)
          if (phoneNumber && phoneNumber.length !== 10) return false
          if (data.heading.custom_links) {
            for (const link of data.heading.custom_links) {
              if (!link.label || link.label.trim() === '' || link.label.length > 20) return false
              if (!link.url || link.url.trim() === '') return false
              try {
                new URL(link.url)
              } catch {
                return false
              }
            }
          }
        }
        return true

      case 'experiences':
        if (data.experiences) {
          for (const exp of data.experiences) {
            if (!exp.company || exp.company.length > 50 || !companyRegex.test(exp.company)) return false
            if (!exp.location || exp.location.length > 60 || !locationRegex.test(exp.location)) return false
            if (!exp.position || exp.position.length > 40 || !positionRegex.test(exp.position)) return false
            if (!exp.start_date || exp.start_date.length > 15 || !dateRegex.test(exp.start_date)) return false
            if (!exp.end_date || exp.end_date.length > 15 || !dateRegex.test(exp.end_date)) return false
            if (exp.projects) {
              for (const proj of exp.projects) {
                if (!proj.title || proj.title.length > 40 || !projectTitleRegex.test(proj.title)) return false
                if (!proj.description || proj.description.length > 250 || !projectDescriptionRegex.test(proj.description)) return false
              }
            }
          }
        }
        return true

      case 'projects':
        if (data.projects) {
          for (const proj of data.projects) {
            if (!proj.name || proj.name.length > 100 || !nameRegex.test(proj.name)) return false
            if (!proj.start_date || proj.start_date.length > 15 || !dateRegex.test(proj.start_date)) return false
            if (!proj.end_date || proj.end_date.length > 15 || !dateRegex.test(proj.end_date)) return false
            if (!proj.tech_stack || proj.tech_stack.length > 100) return false
            if (proj.link && proj.link.trim() !== '') {
              try {
                new URL(proj.link)
              } catch {
                return false
              }
              if (!proj.link_label || proj.link_label.length > 30 || !linkLabelRegex.test(proj.link_label)) return false
            }
            if (proj.subpoints) {
              for (const sub of proj.subpoints) {
                if (!sub || sub.length > 250 || !subpointRegex.test(sub)) return false
              }
            }
          }
        }
        return true

      case 'education':
        if (data.education) {
          for (const edu of data.education) {
            if (!edu.institution || edu.institution.length > 100 || !institutionRegex.test(edu.institution)) return false
            if (!edu.location || edu.location.length > 50 || !locationRegex.test(edu.location)) return false
            if (!edu.degree || edu.degree.length > 100 || !degreePartRegex.test(edu.degree)) return false
            if (!edu.start_date || edu.start_date.length > 15 || !dateRegex.test(edu.start_date)) return false
            if (!edu.end_date || edu.end_date.length > 15 || !dateRegex.test(edu.end_date)) return false
            if (edu.gpa !== null && edu.gpa !== undefined && edu.gpa !== '') {
              const gpaStr = String(edu.gpa)
              const gpaNum = parseFloat(gpaStr)
              if (isNaN(gpaNum) || gpaNum < 0) return false
              const parts = gpaStr.split('.')
              if (parts.length > 1 && parts[1].length > 2) return false
              if (edu.max_gpa !== null && edu.max_gpa !== undefined && edu.max_gpa !== '') {
                const maxGpaStr = String(edu.max_gpa)
                const maxGpaNum = parseFloat(maxGpaStr)
                if (isNaN(maxGpaNum) || maxGpaNum <= 0) return false
                const maxParts = maxGpaStr.split('.')
                if (maxParts.length > 1 && maxParts[1].length > 2) return false
                if (gpaNum > maxGpaNum) return false
              } else {
                return false
              }
            }
            if (edu.courses) {
              for (const course of edu.courses) {
                if (!course || course.length > 30 || !courseRegex.test(course)) return false
              }
            }
          }
        }
        return true

      case 'skills':
        if (data.skills) {
          for (const skill of data.skills) {
            if (!skill.category || skill.category.trim() === '') return false
            if (skill.items.length === 0) return false
            for (const item of skill.items) {
              if (!item || item.trim() === '') return false
            }
          }
        }
        return true

      case 'certifications':
        if (data.certifications) {
          for (const cert of data.certifications) {
            if (!cert.title || cert.title.length > 80 || !titleRegex.test(cert.title)) return false
            if (!cert.start_date || cert.start_date.length > 15 || !dateRegex.test(cert.start_date)) return false
            if (!cert.end_date || cert.end_date.length > 15 || !dateRegex.test(cert.end_date)) return false
            if (!cert.platform || cert.platform.length > 20 || !platformRegex.test(cert.platform)) return false
            if (cert.instructor && cert.instructor.trim() !== '' && !instructorRegex.test(cert.instructor)) return false
            if (cert.certification_link && cert.certification_link.trim() !== '') {
              try {
                new URL(cert.certification_link)
              } catch {
                return false
              }
            }
          }
        }
        return true

      case 'awards':
        if (data.awards) {
          for (const award of data.awards) {
            if (!award.title || award.title.length > 120 || !titleRegex.test(award.title)) return false
            if (!award.date || award.date.length > 15 || !dateRegex.test(award.date)) return false
          }
        }
        return true

      case 'volunteer':
        if (data.volunteer_experiences) {
          for (const vol of data.volunteer_experiences) {
            if (!vol.position || vol.position.length > 50 || !positionVolRegex.test(vol.position)) return false
            if (!vol.organization || vol.organization.length > 100 || !organizationRegex.test(vol.organization)) return false
            if (!vol.location || vol.location.length > 60 || !locationRegex.test(vol.location)) return false
            if (!vol.description || vol.description.length > 250 || !descriptionRegex.test(vol.description)) return false
            if (!vol.start_date || vol.start_date.length > 15 || !dateRegex.test(vol.start_date)) return false
            if (!vol.end_date || vol.end_date.length > 15 || !dateRegex.test(vol.end_date)) return false
          }
        }
        return true

      default:
        return true
    }
  }

  // Get validation status for each tab
  const tabValidationStatus = useMemo(() => {
    if (!data) {
      return {
        heading: true,
        experiences: true,
        projects: true,
        education: true,
        skills: true,
        certifications: true,
        awards: true,
        volunteer: true,
      }
    }
    return {
      heading: validateTab('heading'),
      experiences: validateTab('experiences'),
      projects: validateTab('projects'),
      education: validateTab('education'),
      skills: validateTab('skills'),
      certifications: validateTab('certifications'),
      awards: validateTab('awards'),
      volunteer: validateTab('volunteer'),
    }
  }, [data, parsePhoneNumber])

  // Get list of tabs with errors
  const tabsWithErrors = useMemo(() => {
    return tabs.filter(tab => tabValidationStatus[tab.id as keyof typeof tabValidationStatus] === false)
  }, [tabValidationStatus])

  // Validate all tabs using useMemo to prevent infinite loops
  const isAllValid = useMemo(() => {
    if (!data) return false
    return validateAllTabs()
  }, [data, parsePhoneNumber])

  if (!data) return null

  // Escape special symbols for LaTeX compilation
  const escapePercentSymbols = (text: string): string => {
    return text.replace(/%/g, '\\%')
  }

  const escapeSpecialSymbols = (text: string): string => {
    return text.replace(/%/g, '\\%').replace(/\./g, '\\.')
  }

  // Prepare data for backend with escaped special characters
  const prepareDataForBackend = (dataToPrepare: ExtractedResumeData): ExtractedResumeData => {
    const prepared = { ...dataToPrepare }

    // Escape experience project descriptions (only %)
    if (prepared.experiences) {
      prepared.experiences = prepared.experiences.map(exp => ({
        ...exp,
        projects: exp.projects?.map(proj => ({
          ...proj,
          description: escapePercentSymbols(proj.description)
        })) || null
      }))
    }

    // Escape project subpoints (% and .)
    if (prepared.projects) {
      prepared.projects = prepared.projects.map(proj => ({
        ...proj,
        subpoints: proj.subpoints?.map(sub => escapeSpecialSymbols(sub)) || null
      }))
    }

    // Escape volunteer descriptions (% and .)
    if (prepared.volunteer_experiences) {
      prepared.volunteer_experiences = prepared.volunteer_experiences.map(vol => ({
        ...vol,
        description: escapeSpecialSymbols(vol.description)
      }))
    }

    return prepared
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Prepare data with escaped special characters for LaTeX
      const preparedData = prepareDataForBackend(data)
      
      const response = await api.post('/api/ai/save-extracted-resume', {
        extracted_data: preparedData
      })

      console.log('Save response:', response.data)
      toast.success(response.data?.message || 'Resume data saved successfully!')
      onClose()
    } catch (error: any) {
      console.error('Error saving:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to save resume data'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const updateHeading = (heading: ExtractedResumeData['heading']) => {
    setData({ ...data, heading })
  }

  const updateExperiences = (experiences: ExtractedResumeData['experiences']) => {
    setData({ ...data, experiences })
  }

  const updateProjects = (projects: ExtractedResumeData['projects']) => {
    setData({ ...data, projects })
  }

  const updateEducation = (education: ExtractedResumeData['education']) => {
    setData({ ...data, education })
  }

  const updateSkills = (skills: ExtractedResumeData['skills']) => {
    setData({ ...data, skills })
  }

  const updateCertifications = (certifications: ExtractedResumeData['certifications']) => {
    setData({ ...data, certifications })
  }

  const updateAwards = (awards: ExtractedResumeData['awards']) => {
    setData({ ...data, awards })
  }

  const updateVolunteerExperiences = (volunteer_experiences: ExtractedResumeData['volunteer_experiences']) => {
    setData({ ...data, volunteer_experiences })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-4xl xl:max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl">Review Extracted Resume Data</DialogTitle>
          <DialogDescription className="mt-2 sm:block hidden">
            Review and edit the extracted data before saving. Navigate between sections using the tabs below.
          </DialogDescription>
          {pdfUrl && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfUrl, '_blank')}
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Show PDF
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Tab Navigation - Fixed position, always visible */}
        <div className="shrink-0 border-t border-b border-border bg-background">
          <ExtractedResumeTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            extractedData={data}
            tabValidationStatus={tabValidationStatus}
          />
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 custom-scrollbar">
          {activeTab === 'heading' && (
            <HeadingTab 
              data={data.heading} 
              onUpdate={updateHeading}
              parsePhoneNumber={parsePhoneNumber}
              formatPhoneNumber={formatPhoneNumber}
            />
          )}
          {activeTab === 'experiences' && (
            <ExperiencesTab 
              data={data.experiences || []} 
              onUpdate={updateExperiences}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsTab 
              data={data.projects || []} 
              onUpdate={updateProjects}
            />
          )}
          {activeTab === 'education' && (
            <EducationTab 
              data={data.education || []} 
              onUpdate={updateEducation}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsTab 
              data={data.skills || []} 
              onUpdate={updateSkills}
            />
          )}
          {activeTab === 'certifications' && (
            <CertificationsTab 
              data={data.certifications || []} 
              onUpdate={updateCertifications}
            />
          )}
          {activeTab === 'awards' && (
            <AwardsTab 
              data={data.awards || []} 
              onUpdate={updateAwards}
            />
          )}
          {activeTab === 'volunteer' && (
            <VolunteerTab 
              data={data.volunteer_experiences || []} 
              onUpdate={updateVolunteerExperiences}
            />
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border shrink-0 flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isAllValid}
            className="w-full sm:w-auto order-1 sm:order-2 sm:ml-3"
          >
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
          {!isAllValid && tabsWithErrors.length > 0 && (
            <div className="w-full order-3 mt-2">
              <p className="text-xs text-destructive mb-1">
                Please fix validation errors in the following sections:
              </p>
              <div className="hidden sm:flex sm:flex-wrap gap-2">
                {tabsWithErrors.map(tab => (
                  <span
                    key={tab.id}
                    className="text-xs px-2 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20"
                  >
                    {tab.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
