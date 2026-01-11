import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { VolunteerExperienceData } from '../types'

// Validation helpers
const positionRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014&]+$/
const organizationRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const locationRegex = /^[a-zA-Z0-9\s,]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const descriptionRegex = /^[a-zA-Z0-9\s,%.\-\u2013\u2014+()xX\u00D7]+$/

interface VolunteerTabProps {
  data: VolunteerExperienceData[]
  onUpdate: (data: VolunteerExperienceData[]) => void
}

export const VolunteerTab = ({ data, onUpdate }: VolunteerTabProps) => {
  const [volunteers, setVolunteers] = useState<VolunteerExperienceData[]>(data)

  useEffect(() => {
    setVolunteers(data)
  }, [data])

  const updateVolunteer = (index: number, field: keyof VolunteerExperienceData, value: string) => {
    const updated = [...volunteers]
    updated[index] = { ...updated[index], [field]: value }
    setVolunteers(updated)
    onUpdate(updated)
  }

  const addVolunteer = () => {
    const newVol: VolunteerExperienceData = {
      position: '',
      organization: '',
      location: '',
      description: '',
      start_date: '',
      end_date: ''
    }
    const updated = [...volunteers, newVol]
    setVolunteers(updated)
    onUpdate(updated)
  }

  const removeVolunteer = (index: number) => {
    const updated = volunteers.filter((_, i) => i !== index)
    setVolunteers(updated)
    onUpdate(updated)
  }

  const validateField = (field: string, value: string, type: 'position' | 'organization' | 'location' | 'date' | 'description'): string | null => {
    if (!value || value.trim() === '') {
      return `${field} is required`
    }
    switch (type) {
      case 'position':
        if (value.length > 50) return 'Position must be at most 50 characters'
        if (!positionRegex.test(value)) return 'Position can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —, &'
        break
      case 'organization':
        if (value.length > 100) return 'Organization must be at most 100 characters'
        if (!organizationRegex.test(value)) return 'Organization can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'
        break
      case 'location':
        if (value.length > 60) return 'Location must be at most 60 characters'
        if (!locationRegex.test(value)) return 'Location can only contain A-Z, a-z, 0-9, spaces, ,'
        break
      case 'date':
        if (value.length > 15) return 'Date must be at most 15 characters'
        if (!dateRegex.test(value)) return 'Date can only contain A-Z, a-z, 0-9, spaces'
        break
      case 'description':
        if (value.length > 250) return 'Description must be at most 250 characters'
        if (!descriptionRegex.test(value)) return 'Description can only contain A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %'
        break
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold">Volunteer Experiences</h3>
        <Button type="button" variant="outline" size="sm" onClick={addVolunteer} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Volunteer Experience
        </Button>
      </div>
      {volunteers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No volunteer experiences added</p>
      ) : (
        <div className="space-y-4">
          {volunteers.map((vol, volIndex) => (
            <div key={`volunteer-${volIndex}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Volunteer Experience {volIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVolunteer(volIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Position</label>
                  <Input
                    value={vol.position}
                    onChange={(e) => updateVolunteer(volIndex, 'position', e.target.value)}
                    placeholder="e.g., Volunteer Coordinator"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 50 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —, &
                  </p>
                  {validateField('Position', vol.position, 'position') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Position', vol.position, 'position')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Organization</label>
                  <Input
                    value={vol.organization}
                    onChange={(e) => updateVolunteer(volIndex, 'organization', e.target.value)}
                    placeholder="e.g., Local Food Bank"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 100 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                  </p>
                  {validateField('Organization', vol.organization, 'organization') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Organization', vol.organization, 'organization')}</p>
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
                    value={vol.location}
                    onChange={(e) => updateVolunteer(volIndex, 'location', e.target.value)}
                    placeholder="e.g., City, State, Country"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 60 characters. Allowed: A-Z, a-z, 0-9, spaces, ,
                  </p>
                  {validateField('Location', vol.location, 'location') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Location', vol.location, 'location')}</p>
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
                        value={vol.start_date}
                        onChange={(e) => updateVolunteer(volIndex, 'start_date', e.target.value)}
                        placeholder="e.g., Aug, 2020"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('Start date', vol.start_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Start date', vol.start_date, 'date')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        value={vol.end_date}
                        onChange={(e) => updateVolunteer(volIndex, 'end_date', e.target.value)}
                        placeholder="e.g., Dec, 2023 or Present"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Can be "Present" or date. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('End date', vol.end_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('End date', vol.end_date, 'date')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={vol.description}
                    onChange={(e) => updateVolunteer(volIndex, 'description', e.target.value)}
                    placeholder="e.g., Organized food distribution events and managed volunteer schedules"
                    maxLength={250}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 250 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, ., -, –, —, +, (), x, X, ×, %
                  </p>
                  {validateField('Description', vol.description, 'description') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Description', vol.description, 'description')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
