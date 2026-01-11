import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CertificationData } from '../types'

// Validation helpers
const titleRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014+&()]+$/
const dateRegex = /^[a-zA-Z0-9\s]+$/
const instructorRegex = /^[a-zA-Z\s,]+$/
const platformRegex = /^[a-zA-Z0-9\s,\-\u2013\u2014]+$/

interface CertificationsTabProps {
  data: CertificationData[]
  onUpdate: (data: CertificationData[]) => void
}

export const CertificationsTab = ({ data, onUpdate }: CertificationsTabProps) => {
  const [certifications, setCertifications] = useState<CertificationData[]>(data)

  useEffect(() => {
    setCertifications(data)
  }, [data])

  const updateCertification = (index: number, field: keyof CertificationData, value: any) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
    onUpdate(updated)
  }

  const addCertification = () => {
    const newCert: CertificationData = {
      title: '',
      start_date: '',
      end_date: '',
      instructor: null,
      platform: '',
      certification_link: null
    }
    const updated = [...certifications, newCert]
    setCertifications(updated)
    onUpdate(updated)
  }

  const removeCertification = (index: number) => {
    const updated = certifications.filter((_, i) => i !== index)
    setCertifications(updated)
    onUpdate(updated)
  }

  const validateField = (field: string, value: string | null, type: 'title' | 'date' | 'instructor' | 'platform' | 'url'): string | null => {
    if (type === 'instructor' || type === 'url') {
      if (!value || value.trim() === '') return null // Optional fields
    } else {
      if (!value || value.trim() === '') {
        return `${field} is required`
      }
    }
    switch (type) {
      case 'title':
        if (value!.length > 80) return 'Title must be at most 80 characters'
        if (!titleRegex.test(value!)) return 'Title can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —, +, &, ()'
        break
      case 'date':
        if (value!.length > 15) return 'Date must be at most 15 characters'
        if (!dateRegex.test(value!)) return 'Date can only contain A-Z, a-z, 0-9, spaces'
        break
      case 'instructor':
        if (value && value.trim() !== '' && !instructorRegex.test(value)) return 'Instructor can only contain A-Z, a-z, spaces, ,'
        break
      case 'platform':
        if (value!.length > 20) return 'Platform must be at most 20 characters'
        if (!platformRegex.test(value!)) return 'Platform can only contain A-Z, a-z, 0-9, spaces, ,, -, –, —'
        break
      case 'url':
        if (value && value.trim() !== '') {
          try {
            new URL(value)
          } catch {
            return 'Must be a valid URL'
          }
        }
        break
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold">Certifications</h3>
        <Button type="button" variant="outline" size="sm" onClick={addCertification} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </div>
      {certifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certifications added</p>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert, certIndex) => (
            <div key={`certification-${certIndex}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Certification {certIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCertification(certIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Certification Title</label>
                  <Input
                    value={cert.title}
                    onChange={(e) => updateCertification(certIndex, 'title', e.target.value)}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 80 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —, +, &, ()
                  </p>
                  {validateField('Title', cert.title, 'title') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Title', cert.title, 'title')}</p>
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
                        value={cert.start_date}
                        onChange={(e) => updateCertification(certIndex, 'start_date', e.target.value)}
                        placeholder="e.g., Aug, 2020"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('Start date', cert.start_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('Start date', cert.start_date, 'date')}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Input
                        value={cert.end_date}
                        onChange={(e) => updateCertification(certIndex, 'end_date', e.target.value)}
                        placeholder="e.g., Dec, 2023 or Present"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 15 characters. Can be "Present" or date. Allowed: A-Z, a-z, 0-9, spaces
                      </p>
                      {validateField('End date', cert.end_date, 'date') && (
                        <p className="text-xs text-destructive mt-1">{validateField('End date', cert.end_date, 'date')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Instructor (Optional)</label>
                  <Input
                    value={cert.instructor || ''}
                    onChange={(e) => updateCertification(certIndex, 'instructor', e.target.value || null)}
                    placeholder="e.g., John Doe"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. Only alphabets, spaces, and commas allowed.
                  </p>
                  {validateField('Instructor', cert.instructor, 'instructor') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Instructor', cert.instructor, 'instructor')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <Input
                    value={cert.platform}
                    onChange={(e) => updateCertification(certIndex, 'platform', e.target.value)}
                    placeholder="e.g., AWS, Coursera, Udemy"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 20 characters. Allowed: A-Z, a-z, 0-9, spaces, ,, -, –, —
                  </p>
                  {validateField('Platform', cert.platform, 'platform') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Platform', cert.platform, 'platform')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Certification Link (Optional)</label>
                  <Input
                    value={cert.certification_link || ''}
                    onChange={(e) => updateCertification(certIndex, 'certification_link', e.target.value || null)}
                    placeholder="e.g., https://aws.amazon.com/certification/verify"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. Must be a valid URL.
                  </p>
                  {validateField('Certification link', cert.certification_link, 'url') && (
                    <p className="text-xs text-destructive mt-1">{validateField('Certification link', cert.certification_link, 'url')}</p>
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
