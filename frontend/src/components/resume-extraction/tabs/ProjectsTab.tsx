import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectData } from '../types'

// Validation helpers
const nameRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const linkLabelRegex = /^[a-zA-Z0-9\s]+$/
const subpointRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/

interface ProjectsTabProps {
  data: ProjectData[]
  onUpdate: (data: ProjectData[]) => void
}

export const ProjectsTab = ({ data, onUpdate }: ProjectsTabProps) => {
  const [projects, setProjects] = useState<ProjectData[]>(data)

  useEffect(() => {
    setProjects(data)
  }, [data])

  const updateProject = (index: number, field: keyof ProjectData, value: any) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
    onUpdate(updated)
  }

  const addProject = () => {
    const newProj: ProjectData = {
      name: '',
      start_date: '',
      end_date: '',
      tech_stack: '',
      link: null,
      link_label: null,
      subpoints: []
    }
    const updated = [...projects, newProj]
    setProjects(updated)
    onUpdate(updated)
  }

  const removeProject = (index: number) => {
    const updated = projects.filter((_, i) => i !== index)
    setProjects(updated)
    onUpdate(updated)
  }

  const addSubpoint = (projIndex: number) => {
    const updated = [...projects]
    if (!updated[projIndex].subpoints) {
      updated[projIndex].subpoints = []
    }
    updated[projIndex].subpoints!.push('')
    setProjects(updated)
    onUpdate(updated)
  }

  const removeSubpoint = (projIndex: number, subIndex: number) => {
    const updated = [...projects]
    if (updated[projIndex].subpoints) {
      updated[projIndex].subpoints = updated[projIndex].subpoints!.filter((_, i) => i !== subIndex)
      setProjects(updated)
      onUpdate(updated)
    }
  }

  const updateSubpoint = (projIndex: number, subIndex: number, value: string) => {
    const updated = [...projects]
    if (updated[projIndex].subpoints) {
      updated[projIndex].subpoints![subIndex] = value
      setProjects(updated)
      onUpdate(updated)
    }
  }

  const validateField = (field: string, value: string | null, type: 'name' | 'date' | 'techStack' | 'link' | 'linkLabel' | 'subpoint', link?: string | null): string | null => {
    if (type === 'link' || type === 'linkLabel') {
      if (!value || value.trim() === '') return null // Optional
    } else {
      if (!value || value.trim() === '') {
        return `${field} is required`
      }
    }
    switch (type) {
      case 'name':
        if (value!.length > 100) return 'Project name must be at most 100 characters'
        if (!nameRegex.test(value!)) return 'Project name can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'
        break
      case 'date':
        if (value!.length > 15) return 'Date must be at most 15 characters'
        if (!dateRegex.test(value!)) return 'Date can only contain A-Z, a-z, 0-9, spaces'
        break
      case 'techStack':
        if (value!.length > 100) return 'Tech stack must be at most 100 characters'
        break
      case 'link':
        if (value && value.trim() !== '') {
          try {
            new URL(value)
          } catch {
            return 'Must be a valid URL'
          }
        }
        break
      case 'linkLabel':
        if (value && value.trim() !== '') {
          if (value.length > 30) return 'Link label must be at most 30 characters'
          if (!linkLabelRegex.test(value)) return 'Link label can only contain A-Z, a-z, 0-9, spaces'
        }
        if (link && link.trim() !== '' && (!value || value.trim() === '')) {
          return 'Link label is required when link is provided'
        }
        break
      case 'subpoint':
        if (value!.length > 250) return 'Subpoint must be at most 250 characters'
        if (!subpointRegex.test(value!)) return 'Subpoint can only contain A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %'
        break
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projects</h3>
        <Button type="button" variant="outline" size="sm" onClick={addProject}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects added</p>
      ) : (
        <div className="space-y-4">
          {projects.map((proj, projIndex) => (
            <div key={`project-${projIndex}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Project {projIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProject(projIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Name</label>
                  <Input
                    value={proj.name}
                    onChange={(e) => updateProject(projIndex, 'name', e.target.value)}
                    placeholder="e.g., E-commerce Platform"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 100 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                  </p>
                  {validateField('Project name', proj.name, 'name') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Project name', proj.name, 'name')}</p>
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
                        value={proj.start_date}
                        onChange={(e) => updateProject(projIndex, 'start_date', e.target.value)}
                        placeholder="e.g., Aug, 2020"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('Start date', proj.start_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Start date', proj.start_date, 'date')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        value={proj.end_date}
                        onChange={(e) => updateProject(projIndex, 'end_date', e.target.value)}
                        placeholder="e.g., Dec, 2023 or Present"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Can be "Present" or date. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('End date', proj.end_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('End date', proj.end_date, 'date')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tech Stack</label>
                  <Input
                    value={proj.tech_stack}
                    onChange={(e) => updateProject(projIndex, 'tech_stack', e.target.value)}
                    placeholder="e.g., Node, Express, React, MongoDB"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 100 characters.
                  </p>
                  {validateField('Tech stack', proj.tech_stack, 'techStack') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Tech stack', proj.tech_stack, 'techStack')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Link (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        value={proj.link || ''}
                        onChange={(e) => updateProject(projIndex, 'link', e.target.value || null)}
                        placeholder="e.g., https://github.com/user/project"
                        type="url"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. Must be a valid URL.
                      </p>
                      {validateField('Link', proj.link, 'link') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Link', proj.link, 'link')}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={proj.link_label || ''}
                        onChange={(e) => updateProject(projIndex, 'link_label', e.target.value || null)}
                        placeholder="e.g., GitHub, GitLab, Live Demo"
                        maxLength={30}
                        disabled={!proj.link || proj.link === ''}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. Maximum 30 characters. Allowed: A-Z, a-z, 0-9, spaces. Required if link is provided.
                      </p>
                      {validateField('Link label', proj.link_label, 'linkLabel', proj.link) && (
                        <p className="text-xs text-destructive mt-1">{validateField('Link label', proj.link_label, 'linkLabel', proj.link)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="text-sm font-medium">Subpoints</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSubpoint(projIndex)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subpoint
                  </Button>
                </div>
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Good resumes have 1-3 subpoints in each project.
                  </p>
                </div>
                {proj.subpoints && proj.subpoints.length > 0 ? (
                  <div className="space-y-2">
                    {proj.subpoints.map((sub, subIndex) => (
                      <div key={`project-${projIndex}-subpoint-${subIndex}`} className="flex gap-2">
                        <div className="flex-1">
                          <Textarea
                            value={sub}
                            onChange={(e) => updateSubpoint(projIndex, subIndex, e.target.value)}
                            placeholder="e.g., Built a scalable e-commerce platform that increased sales by 25%"
                            maxLength={250}
                            rows={3}
                            className="flex-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum 250 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, % (e.g., "increased by 25%" or "4x faster" or "4× faster").
                          </p>
                          {validateField('Subpoint', sub, 'subpoint') && (
                            <p className="text-xs text-destructive mt-1">{validateField('Subpoint', sub, 'subpoint')}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubpoint(projIndex, subIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No subpoints added</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
