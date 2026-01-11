import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EducationData } from '../types'

// Validation helpers
const institutionRegex = /^[a-zA-Z0-9\s,]+$/
const locationRegex = /^[a-zA-Z0-9\s,]+$/
const degreePartRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014()]+$/
const courseRegex = /^[a-zA-Z0-9\s,]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/

interface EducationTabProps {
  data: EducationData[]
  onUpdate: (data: EducationData[]) => void
}

export const EducationTab = ({ data, onUpdate }: EducationTabProps) => {
  const [education, setEducation] = useState<EducationData[]>(data)

  useEffect(() => {
    setEducation(data)
  }, [data])

  const updateEducation = (index: number, field: keyof EducationData, value: any) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setEducation(updated)
    onUpdate(updated)
  }

  const addEducation = () => {
    const newEdu: EducationData = {
      institution: '',
      location: '',
      degree: '',
      gpa: null,
      max_gpa: null,
      start_date: '',
      end_date: '',
      courses: []
    }
    const updated = [...education, newEdu]
    setEducation(updated)
    onUpdate(updated)
  }

  const removeEducation = (index: number) => {
    const updated = education.filter((_, i) => i !== index)
    setEducation(updated)
    onUpdate(updated)
  }

  const addCourse = (eduIndex: number) => {
    const updated = [...education]
    if (!updated[eduIndex].courses) {
      updated[eduIndex].courses = []
    }
    updated[eduIndex].courses!.push('')
    setEducation(updated)
    onUpdate(updated)
  }

  const removeCourse = (eduIndex: number, courseIndex: number) => {
    const updated = [...education]
    if (updated[eduIndex].courses) {
      updated[eduIndex].courses = updated[eduIndex].courses!.filter((_, i) => i !== courseIndex)
      setEducation(updated)
      onUpdate(updated)
    }
  }

  const updateCourse = (eduIndex: number, courseIndex: number, value: string) => {
    const updated = [...education]
    if (updated[eduIndex].courses) {
      updated[eduIndex].courses![courseIndex] = value
      setEducation(updated)
      onUpdate(updated)
    }
  }

  const validateField = (field: string, value: string | number | null, type: 'institution' | 'location' | 'degree' | 'date' | 'course' | 'gpa' | 'maxGpa', maxGpa?: number | null): string | null => {
    if (type === 'gpa' || type === 'maxGpa') {
      if (value === null || value === '' || value === undefined) return null // Optional
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num)) return `${field} must be a valid number`
      if (num < 0) return `${field} must be non-negative`
      const parts = String(value).split('.')
      if (parts.length > 1 && parts[1].length > 2) return `${field} must have at most 2 decimal places`
      if (type === 'gpa' && maxGpa !== null && maxGpa !== undefined) {
        const maxGpaNum = typeof maxGpa === 'number' ? maxGpa : parseFloat(String(maxGpa))
        if (!isNaN(maxGpaNum) && num > maxGpaNum) return 'GPA cannot exceed Maximum GPA'
      }
      if (type === 'maxGpa' && num <= 0) return 'Maximum GPA must be a valid positive number'
      return null
    }
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${field} is required`
    }
    const strValue = String(value)
    switch (type) {
      case 'institution':
        if (strValue.length > 100) return 'Institution must be at most 100 characters'
        if (!institutionRegex.test(strValue)) return 'Institution can only contain A-Z, a-z, 0-9, spaces, ,'
        break
      case 'location':
        if (strValue.length > 50) return 'Location must be at most 50 characters'
        if (!locationRegex.test(strValue)) return 'Location can only contain A-Z, a-z, 0-9, spaces, ,'
        break
      case 'degree':
        if (strValue.length > 100) return 'Total degree length (including all parts) must not exceed 100 characters'
        if (!degreePartRegex.test(strValue)) return 'Degree can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —, ()'
        break
      case 'date':
        if (strValue.length > 15) return 'Date must be at most 15 characters'
        if (!dateRegex.test(strValue)) return 'Date can only contain A-Z, a-z, 0-9, spaces'
        break
      case 'course':
        if (strValue.length > 30) return 'Course name must be at most 30 characters'
        if (!courseRegex.test(strValue)) return 'Course name can only contain A-Z, a-z, 0-9, spaces, ,'
        break
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Education</h3>
        <Button type="button" variant="outline" size="sm" onClick={addEducation}>
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>
      {education.length === 0 ? (
        <p className="text-sm text-muted-foreground">No education entries added</p>
      ) : (
        <div className="space-y-4">
          {education.map((edu, eduIndex) => (
            <div key={`education-${eduIndex}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Education {eduIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEducation(eduIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Institution Name</label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(eduIndex, 'institution', e.target.value)}
                    placeholder="e.g., Massachusetts Institute of Technology"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 100 characters. Allowed: A-Z, a-z, 0-9, spaces, ,
                  </p>
                  {validateField('Institution', edu.institution, 'institution') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Institution', edu.institution, 'institution')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    value={edu.location}
                    onChange={(e) => updateEducation(eduIndex, 'location', e.target.value)}
                    placeholder="e.g., Cambridge, MA, USA"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 50 characters. Format: "Education Centre State, Education Center Country" is appropriate for resumes. Allowed: A-Z, a-z, 0-9, spaces, ,
                  </p>
                  {validateField('Location', edu.location, 'location') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Location', edu.location, 'location')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Degree</label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(eduIndex, 'degree', e.target.value)}
                    placeholder="e.g., Bachelor of Technology - Computer Science (AI-ML specialization)"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total degree length (including all parts) must not exceed 100 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —, ()
                  </p>
                  {validateField('Degree', edu.degree, 'degree') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Degree', edu.degree, 'degree')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">GPA (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(eduIndex, 'gpa', e.target.value || null)}
                        placeholder="e.g., 7.84"
                        type="number"
                        step="0.01"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. Must be non-negative and not exceed Maximum GPA. Maximum 2 decimal places.
                      </p>
                      {validateField('GPA', edu.gpa, 'gpa', edu.max_gpa) && (
                        <p className="text-xs text-destructive mt-1">{validateField('GPA', edu.gpa, 'gpa', edu.max_gpa)}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={edu.max_gpa || ''}
                        onChange={(e) => updateEducation(eduIndex, 'max_gpa', e.target.value || null)}
                        placeholder="e.g., 10.00"
                        type="number"
                        step="0.01"
                        disabled={!edu.gpa || edu.gpa === ''}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Required if GPA is provided. Maximum 2 decimal places.
                      </p>
                      {validateField('Maximum GPA', edu.max_gpa, 'maxGpa') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Maximum GPA', edu.max_gpa, 'maxGpa')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Input
                        value={edu.start_date}
                        onChange={(e) => updateEducation(eduIndex, 'start_date', e.target.value)}
                        placeholder="e.g., Aug 2020"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Recommended format: "Month Year" (e.g., Aug 2027).
                      </p>
                      {validateField('Start date', edu.start_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Start date', edu.start_date, 'date')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        value={edu.end_date}
                        onChange={(e) => updateEducation(eduIndex, 'end_date', e.target.value)}
                        placeholder="e.g., May 2024 or Present"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Can be "Present" or date. Recommended format: "Month Year" (e.g., Aug 2027).
                      </p>
                      {validateField('End date', edu.end_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('End date', edu.end_date, 'date')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="text-sm font-medium">Courses</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addCourse(eduIndex)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Course
                  </Button>
                </div>
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Each course can only contain A-Z, a-z, 0-9, spaces, ,. Maximum 30 characters per course.
                  </p>
                </div>
                {edu.courses && edu.courses.length > 0 ? (
                  <div className="space-y-2">
                    {edu.courses.map((course, courseIndex) => (
                      <div key={`education-${eduIndex}-course-${courseIndex}`} className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={course}
                            onChange={(e) => updateCourse(eduIndex, courseIndex, e.target.value)}
                            placeholder="e.g., Data Structures and Algorithms"
                            maxLength={30}
                            className="flex-1"
                          />
                          {validateField('Course', course, 'course') && (
                            <p className="text-xs text-destructive mt-1">{validateField('Course', course, 'course')}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCourse(eduIndex, courseIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No courses added</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
