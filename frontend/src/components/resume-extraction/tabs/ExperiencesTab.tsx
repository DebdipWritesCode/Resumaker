import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ExperienceData } from '../types'

// Validation helpers
const companyRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const locationRegex = /^[a-zA-Z0-9\s,]+$/
const positionRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const projectTitleRegex = /^[a-zA-Z0-9\s,]+$/
const projectDescriptionRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/

interface ExperiencesTabProps {
  data: ExperienceData[]
  onUpdate: (data: ExperienceData[]) => void
}

export const ExperiencesTab = ({ data, onUpdate }: ExperiencesTabProps) => {
  const [experiences, setExperiences] = useState<ExperienceData[]>(data)

  useEffect(() => {
    setExperiences(data)
  }, [data])

  const updateExperience = (index: number, field: keyof ExperienceData, value: any) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    setExperiences(updated)
    onUpdate(updated)
  }

  const addExperience = () => {
    const newExp: ExperienceData = {
      company: '',
      location: '',
      position: '',
      start_date: '',
      end_date: '',
      projects: []
    }
    const updated = [...experiences, newExp]
    setExperiences(updated)
    onUpdate(updated)
  }

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index)
    setExperiences(updated)
    onUpdate(updated)
  }

  const addProject = (expIndex: number) => {
    const updated = [...experiences]
    if (!updated[expIndex].projects) {
      updated[expIndex].projects = []
    }
    updated[expIndex].projects!.push({ title: '', description: '' })
    setExperiences(updated)
    onUpdate(updated)
  }

  const removeProject = (expIndex: number, projIndex: number) => {
    const updated = [...experiences]
    if (updated[expIndex].projects) {
      updated[expIndex].projects = updated[expIndex].projects!.filter((_, i) => i !== projIndex)
      setExperiences(updated)
      onUpdate(updated)
    }
  }

  const updateProject = (expIndex: number, projIndex: number, field: 'title' | 'description', value: string) => {
    const updated = [...experiences]
    if (updated[expIndex].projects) {
      updated[expIndex].projects![projIndex] = {
        ...updated[expIndex].projects![projIndex],
        [field]: value
      }
      setExperiences(updated)
      onUpdate(updated)
    }
  }

  const validateField = (field: string, value: string, type: 'company' | 'location' | 'position' | 'date' | 'projectTitle' | 'projectDescription'): string | null => {
    if (!value || value.trim() === '') {
      return `${field} is required`
    }
    switch (type) {
      case 'company':
        if (value.length > 50) return 'Company must be at most 50 characters'
        if (!companyRegex.test(value)) return 'Company can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'
        break
      case 'location':
        if (value.length > 60) return 'Location must be at most 60 characters'
        if (!locationRegex.test(value)) return 'Location can only contain A-Z, a-z, 0-9, spaces, ,'
        break
      case 'position':
        if (value.length > 40) return 'Position must be at most 40 characters'
        if (!positionRegex.test(value)) return 'Position can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'
        break
      case 'date':
        if (value.length > 15) return 'Date must be at most 15 characters'
        if (!dateRegex.test(value)) return 'Date can only contain A-Z, a-z, 0-9, spaces'
        break
      case 'projectTitle':
        if (value.length > 40) return 'Project title must be at most 40 characters'
        if (!projectTitleRegex.test(value)) return 'Project title can only contain A-Z, a-z, 0-9, spaces, ,'
        break
      case 'projectDescription':
        if (value.length > 250) return 'Project description must be at most 250 characters'
        if (!projectDescriptionRegex.test(value)) return 'Project description can only contain A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %'
        break
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Work Experiences</h3>
        <Button type="button" variant="outline" size="sm" onClick={addExperience}>
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>
      {experiences.length === 0 ? (
        <p className="text-sm text-muted-foreground">No experiences added</p>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, expIndex) => (
            <div key={`experience-${expIndex}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Experience {expIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExperience(expIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Name</label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                    placeholder="e.g., Google Inc."
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 50 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                  </p>
                  {validateField('Company', exp.company, 'company') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Company', exp.company, 'company')}</p>
                  )}
                </div>
                <div>
                  <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 mb-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Good resumes have location as "City, State, Country" format.
                    </p>
                  </div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateExperience(expIndex, 'location', e.target.value)}
                    placeholder="e.g., Mountain View, CA, USA"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 60 characters. Allowed: A-Z, a-z, 0-9, spaces, ,
                  </p>
                  {validateField('Location', exp.location, 'location') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Location', exp.location, 'location')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Position</label>
                  <Input
                    value={exp.position}
                    onChange={(e) => updateExperience(expIndex, 'position', e.target.value)}
                    placeholder="e.g., Software Engineer"
                    maxLength={40}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 40 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                  </p>
                  {validateField('Position', exp.position, 'position') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Position', exp.position, 'position')}</p>
                  )}
                </div>
                <div>
                  <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 mb-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Good resumes have time in format of "Month, Year" like "Aug, 2027".
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Input
                        value={exp.start_date}
                        onChange={(e) => updateExperience(expIndex, 'start_date', e.target.value)}
                        placeholder="e.g., Aug, 2020"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('Start date', exp.start_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Start date', exp.start_date, 'date')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        value={exp.end_date}
                        onChange={(e) => updateExperience(expIndex, 'end_date', e.target.value)}
                        placeholder="e.g., Dec, 2023 or Present"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Can be "Present" or date. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('End date', exp.end_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('End date', exp.end_date, 'date')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="text-sm font-medium">Projects</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addProject(expIndex)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Project
                  </Button>
                </div>
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have 1-3 project descriptions.
                  </p>
                </div>
                {exp.projects && exp.projects.length > 0 ? (
                  <div className="space-y-2">
                    {exp.projects.map((proj, projIndex) => (
                      <div key={`exp-${expIndex}-project-${projIndex}`} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <div>
                            <Input
                              value={proj.title}
                              onChange={(e) => updateProject(expIndex, projIndex, 'title', e.target.value)}
                              placeholder="e.g., E-commerce Platform"
                              maxLength={40}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Maximum 40 characters. Allowed: A-Z, a-z, 0-9, spaces, ,
                            </p>
                            {validateField('Project title', proj.title, 'projectTitle') && (
                              <p className="text-xs text-destructive mt-1">{validateField('Project title', proj.title, 'projectTitle')}</p>
                            )}
                          </div>
                          <div>
                            <Textarea
                              value={proj.description}
                              onChange={(e) => updateProject(expIndex, projIndex, 'description', e.target.value)}
                              placeholder="e.g., Built a scalable e-commerce platform that increased sales by 25%"
                              maxLength={250}
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Maximum 250 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, % (e.g., "increased by 25%" or "4x faster" or "4× faster").
                            </p>
                            {validateField('Project description', proj.description, 'projectDescription') && (
                              <p className="text-xs text-destructive mt-1">{validateField('Project description', proj.description, 'projectDescription')}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProject(expIndex, projIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No projects added</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
