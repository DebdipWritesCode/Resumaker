import { useState, useEffect } from 'react'
import { Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sortedCountryCodes } from '@/utils/countryCodes'
import type { HeadingData, CustomLink } from '../types'

interface HeadingTabProps {
  data: HeadingData | null
  onUpdate: (data: HeadingData) => void
  parsePhoneNumber: (mobile: string | null) => { countryCode: string; phoneNumber: string }
  formatPhoneNumber: (countryCode: string, phoneNumber: string) => string
}

export const HeadingTab = ({ 
  data, 
  onUpdate,
  parsePhoneNumber,
  formatPhoneNumber
}: HeadingTabProps) => {
  const { countryCode: initialCountryCode, phoneNumber: initialPhoneNumber } = parsePhoneNumber(data?.mobile || null)
  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(data?.custom_links || [])

  useEffect(() => {
    const { countryCode: newCountryCode, phoneNumber: newPhoneNumber } = parsePhoneNumber(data?.mobile || null)
    setCountryCode(newCountryCode)
    setPhoneNumber(newPhoneNumber)
    setCustomLinks(data?.custom_links || [])
  }, [data, parsePhoneNumber])

  const validatePhoneNumber = (value: string): string | null => {
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      return 'Phone number must be exactly 10 digits'
    }
    return null
  }

  const validateCustomLink = (link: CustomLink): { label?: string; url?: string } => {
    const errors: { label?: string; url?: string } = {}
    if (!link.label || link.label.trim() === '') {
      errors.label = 'Label is required'
    } else if (link.label.length > 20) {
      errors.label = 'Label must be at most 20 characters'
    }
    if (!link.url || link.url.trim() === '') {
      errors.url = 'URL is required'
    } else {
      try {
        new URL(link.url)
      } catch {
        errors.url = 'Must be a valid URL'
      }
    }
    return errors
  }

  const handlePhoneNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    setPhoneNumber(digitsOnly)
    const formatted = formatPhoneNumber(countryCode, digitsOnly)
    onUpdate({
      mobile: formatted || null,
      custom_links: customLinks.length > 0 ? customLinks : null
    })
  }

  const handleCountryCodeChange = (value: string) => {
    setCountryCode(value)
    const formatted = formatPhoneNumber(value, phoneNumber)
    onUpdate({
      mobile: formatted || null,
      custom_links: customLinks.length > 0 ? customLinks : null
    })
  }

  const handleCustomLinksChange = (links: CustomLink[]) => {
    setCustomLinks(links)
    const formatted = formatPhoneNumber(countryCode, phoneNumber)
    onUpdate({
      mobile: formatted || null,
      custom_links: links.length > 0 ? links : null
    })
  }

  const addCustomLink = () => {
    handleCustomLinksChange([...customLinks, { label: '', url: '' }])
  }

  const removeCustomLink = (index: number) => {
    handleCustomLinksChange(customLinks.filter((_, i) => i !== index))
  }

  const updateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...customLinks]
    updated[index] = { ...updated[index], [field]: value }
    handleCustomLinksChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mobile Number</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium mb-2 block">Country Code</label>
            <select
              value={countryCode}
              onChange={(e) => handleCountryCodeChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              {sortedCountryCodes.map((cc, index) => (
                <option key={`country-${index}-${cc.iso}`} value={cc.code}>
                  {cc.code} {cc.country}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm font-medium mb-2 block">Phone Number (10 digits)</label>
            <Input
              value={phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              placeholder="8274925985"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter 10 digits without spaces or dashes
            </p>
            {phoneNumber && validatePhoneNumber(phoneNumber) && (
              <p className="text-xs text-destructive mt-1">{validatePhoneNumber(phoneNumber)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Custom Links</h3>
          <Button type="button" variant="outline" size="sm" onClick={addCustomLink} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
        <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Good resumes generally have 2 links usually LinkedIn, GitHub or Portfolio
          </p>
        </div>
        {customLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom links added</p>
        ) : (
          <div className="space-y-3">
            {customLinks.map((link, index) => {
              const errors = validateCustomLink(link)
              return (
                <div key={`custom-link-${index}`} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Input
                        value={link.label}
                        onChange={(e) => updateCustomLink(index, 'label', e.target.value)}
                        placeholder="Label (e.g., LinkedIn)"
                        maxLength={20}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max 20 characters</p>
                      {errors.label && (
                        <p className="text-xs text-destructive mt-1">{errors.label}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={link.url}
                        onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                        placeholder="URL (e.g., https://linkedin.com/in/...)"
                        type="url"
                      />
                      {errors.url && (
                        <p className="text-xs text-destructive mt-1">{errors.url}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
