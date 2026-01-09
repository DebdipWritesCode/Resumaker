import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchHeading, createHeading, updateHeading, deleteHeading } from '@/store/slices/headingSlice'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Plus, X, Info, Phone, Link as LinkIcon, Edit2, Trash2 } from 'lucide-react'
import { sortedCountryCodes, getFlagEmoji } from '@/utils/countryCodes'
import { toast } from 'react-toastify'

const customLinkSchema = z.object({
  label: z.string().min(1, 'Label is required').max(20, 'Label must be at most 20 characters'),
  url: z.string().url('Must be a valid URL'),
})

const headingSchema = z.object({
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  customLinks: z.array(customLinkSchema).optional(),
})

type HeadingFormValues = z.infer<typeof headingSchema>

const Heading = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { headings, loading, error } = useSelector((state: RootState) => state.heading)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingHeadingId, setEditingHeadingId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchHeading())
  }, [dispatch])

  const form = useForm<HeadingFormValues>({
    resolver: zodResolver(headingSchema),
    defaultValues: {
      countryCode: '+91',
      phoneNumber: '',
      customLinks: [],
    },
  })

  // Parse phone number from format +91-827-4925-985
  const parsePhoneNumber = (mobile: string | null): { countryCode: string; phoneNumber: string } => {
    if (!mobile) return { countryCode: '+91', phoneNumber: '' }
    
    const parts = mobile.split('-')
    if (parts.length >= 4) {
      const countryCode = parts[0] // +91
      // Extract all digits from remaining parts (827-4925-985 -> 8274925985)
      const phoneNumber = parts.slice(1).join('').replace(/\D/g, '')
      return { countryCode, phoneNumber }
    }
    return { countryCode: '+91', phoneNumber: '' }
  }

  const handleOpenDialog = () => {
    // Always reset to empty for adding new heading
    setEditingHeadingId(null)
    form.reset({
      countryCode: '+91',
      phoneNumber: '',
      customLinks: [],
    })
    setIsDialogOpen(true)
  }

  const handleEditHeading = (headingItem: { id: number; mobile: string | null; custom_links: Array<{ label: string; url: string }> | null }) => {
    setEditingHeadingId(headingItem.id)
    const { countryCode, phoneNumber } = parsePhoneNumber(headingItem.mobile)
    form.reset({
      countryCode,
      phoneNumber,
      customLinks: headingItem.custom_links || [],
    })
    setIsDialogOpen(true)
  }

  const handleDeleteHeading = async (headingId: number) => {
    if (!window.confirm('Are you sure you want to delete this heading?')) {
      return
    }
    try {
      await dispatch(deleteHeading(headingId)).unwrap()
      toast.success('Heading deleted successfully')
      dispatch(fetchHeading())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete heading'
      toast.error(errorMessage)
    }
  }

  const { watch, setValue } = form
  const customLinks = watch('customLinks') || []

  // Format phone number for backend: +91-827-4925-985
  const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
    // Remove any non-digits from phone number
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length !== 10) return ''

    // Format: +91-827-4925-985 (country code, dash, 3 digits, dash, 4 digits, dash, 3 digits)
    const formatted = `${countryCode}-${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    return formatted
  }

  const onSubmit = async (data: HeadingFormValues) => {
    setIsSubmitting(true)
    try {
      const formattedMobile = formatPhoneNumber(data.countryCode, data.phoneNumber)
      
      if (!formattedMobile) {
        toast.error('Please enter a valid 10-digit phone number')
        setIsSubmitting(false)
        return
      }
      
      // Send empty array if no custom links, not null
      const customLinks = data.customLinks && data.customLinks.length > 0 
        ? data.customLinks 
        : []
      
      if (editingHeadingId !== null) {
        // Update existing heading using PUT
        await dispatch(
          updateHeading({
            headingId: editingHeadingId,
            data: {
              mobile: formattedMobile,
              custom_links: customLinks,
            },
          })
        ).unwrap()
        toast.success('Heading updated successfully')
      } else {
        // Create new heading using POST
        await dispatch(
          createHeading({
            mobile: formattedMobile,
            custom_links: customLinks,
          })
        ).unwrap()
        toast.success('Heading created successfully')
      }

      setIsDialogOpen(false)
      setEditingHeadingId(null)
      form.reset()
      // Refetch to get updated data
      dispatch(fetchHeading())
    } catch (err: any) {
      // Error is already parsed as a string in the Redux slice
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save heading'
      toast.error(errorMessage)
      console.error('Failed to save heading:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCustomLink = () => {
    const currentLinks = customLinks || []
    setValue('customLinks', [...currentLinks, { label: '', url: '' }], { shouldValidate: false })
  }

  const removeCustomLink = (index: number) => {
    const currentLinks = customLinks || []
    setValue('customLinks', currentLinks.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handlePhoneNumberChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    setValue('phoneNumber', digitsOnly, { shouldValidate: true })
  }

  // Show error in toast if there's an error and no headings data (only once)
  useEffect(() => {
    if (error && headings.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && headings.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Heading</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Heading</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your contact information and professional links
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Heading
        </Button>
      </div>

      {headings.length > 0 ? (
        <div className="grid gap-6">
          {headings.map((headingItem, index) => (
            <div
              key={headingItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">Contact Information</h2>
                      <p className="text-sm text-muted-foreground">Phone number and professional links</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditHeading(headingItem)}
                      className="shrink-0 hover:bg-primary/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHeading(headingItem.id)}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Phone Number Section */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Mobile Number</p>
                      <p className="text-lg font-semibold text-foreground">
                        {headingItem.mobile || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Custom Links Section */}
                  <div className="flex items-start gap-4">
                    <LinkIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Custom Links</p>
                      {headingItem.custom_links && headingItem.custom_links.length > 0 ? (
                        <div className="space-y-2">
                          {headingItem.custom_links.map((link, linkIndex) => (
                            <div
                              key={linkIndex}
                              className="group/link flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                            >
                              <div className="p-1.5 rounded-md bg-primary/10 group-hover/link:bg-primary/20 transition-colors">
                                <LinkIcon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm mb-0.5">{link.label}</p>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate block"
                                >
                                  {link.url}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                          <p className="text-sm text-muted-foreground text-center">
                            No custom links added
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
            <div className="border-2 border-dashed rounded-xl p-6 sm:p-12 text-center bg-muted/20">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
              <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Heading Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your mobile number and custom links to your resume heading.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Heading
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingHeadingId(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingHeadingId !== null ? 'Edit Heading' : 'Add Heading'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingHeadingId !== null
                ? 'Update your mobile number and custom links for this heading.'
                : 'Add a new heading with your mobile number and custom links.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Phone Number Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Phone Number</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-1">Country Code</FormLabel>
                        <FormControl className='mt-2'>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {sortedCountryCodes.map((country) => {
                              const flag = getFlagEmoji(country.iso)
                              return (
                                <option key={`${country.code}-${country.iso}`} value={country.code}>
                                  {flag ? `${flag} ` : ''}{country.code} - {country.country}
                                </option>
                              )
                            })}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3">Phone Number (10 digits)</FormLabel>
                        <FormControl className='mt-2'>
                          <Input
                            {...field}
                            placeholder="1234567890"
                            maxLength={10}
                            onChange={(e) => {
                              handlePhoneNumberChange(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter 10 digits without spaces or dashes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Custom Links Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Custom Links</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomLink}
                    className="w-full sm:w-auto"
                  >
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

                {customLinks.map((_, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`customLinks.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-3">Label</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., LinkedIn"
                              maxLength={20}
                            />
                          </FormControl>
                          <FormDescription>
                            Max 20 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`customLinks.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-3">URL</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com"
                                type="url"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomLink(index)}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                {customLinks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No custom links added. Click "Add Link" to add one.
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingHeadingId(null)
                    form.reset()
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Heading
