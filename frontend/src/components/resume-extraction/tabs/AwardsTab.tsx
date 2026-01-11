import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AwardData } from '../types'

// Validation helpers
const titleRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/

interface AwardsTabProps {
  data: AwardData[]
  onUpdate: (data: AwardData[]) => void
}

export const AwardsTab = ({ data, onUpdate }: AwardsTabProps) => {
  const [awards, setAwards] = useState<AwardData[]>(data)

  useEffect(() => {
    setAwards(data)
  }, [data])

  const updateAward = (index: number, field: keyof AwardData, value: string) => {
    const updated = [...awards]
    updated[index] = { ...updated[index], [field]: value }
    setAwards(updated)
    onUpdate(updated)
  }

  const addAward = () => {
    const newAward: AwardData = {
      title: '',
      date: ''
    }
    const updated = [...awards, newAward]
    setAwards(updated)
    onUpdate(updated)
  }

  const removeAward = (index: number) => {
    const updated = awards.filter((_, i) => i !== index)
    setAwards(updated)
    onUpdate(updated)
  }

  const validateField = (field: string, value: string, type: 'title' | 'date'): string | null => {
    if (!value || value.trim() === '') {
      return `${field} is required`
    }
    switch (type) {
      case 'title':
        if (value.length > 120) return 'Title must be at most 120 characters'
        if (!titleRegex.test(value)) return 'Title can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'
        break
      case 'date':
        if (value.length > 15) return 'Date must be at most 15 characters'
        if (!dateRegex.test(value)) return 'Date can only contain A-Z, a-z, 0-9, spaces'
        break
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Awards</h3>
        <Button type="button" variant="outline" size="sm" onClick={addAward}>
          <Plus className="h-4 w-4 mr-2" />
          Add Award
        </Button>
      </div>
      {awards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No awards added</p>
      ) : (
        <div className="space-y-4">
          {awards.map((award, awardIndex) => (
            <div key={`award-${awardIndex}`} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Award {awardIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAward(awardIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Award Title</label>
                  <Input
                    value={award.title}
                    onChange={(e) => updateAward(awardIndex, 'title', e.target.value)}
                    placeholder="e.g., Best Student Award"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 120 characters. Only alphabets, numbers, spaces, commas, and hyphens allowed.
                  </p>
                  {validateField('Title', award.title, 'title') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Title', award.title, 'title')}</p>
                  )}
                </div>
                <div>
                  <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 mb-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Good resumes have time in format of "Month, Year" like "Jan, 2025".
                    </p>
                  </div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    value={award.date}
                    onChange={(e) => updateAward(awardIndex, 'date', e.target.value)}
                    placeholder="e.g., Jan 2025"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 15 characters. Allowed: A-Z, a-z, 0-9, spaces
                  </p>
                  {validateField('Date', award.date, 'date') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Date', award.date, 'date')}</p>
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
