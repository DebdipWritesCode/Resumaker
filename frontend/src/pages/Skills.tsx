import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchSkill, createSkill, updateSkill, deleteSkill } from '@/store/slices/skillSlice'
import type { SkillResponse } from '@/api/skill'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Code, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'

// Validation helpers
const categoryRegex = /^[a-zA-Z0-9\s,]+$/
const itemRegex = /^[a-zA-Z0-9\s\-+]+$/

const itemSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(20, 'Item name must be at most 20 characters')
    .regex(itemRegex, 'Item name can only contain alphabets, numbers, spaces, hyphens, and plus signs'),
})

const skillSchema = z.object({
  category: z
    .string()
    .min(1, 'Category is required')
    .max(20, 'Category must be at most 20 characters')
    .regex(categoryRegex, 'Category can only contain alphabets, numbers, spaces, and commas'),
  items: z
    .array(itemSchema)
    .min(1, 'At least one item is required'),
  notes: z.string().nullable().optional(),
})

type SkillFormValues = z.infer<typeof skillSchema>

const Skills = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { skills, loading, error } = useSelector((state: RootState) => state.skill)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchSkill())
  }, [dispatch])

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      category: '',
      items: [],
      notes: '',
    },
  })

  const handleOpenDialog = () => {
    setEditingSkillId(null)
    form.reset({
      category: '',
      items: [],
      notes: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditSkill = (skillItem: SkillResponse) => {
    try {
      setEditingSkillId(skillItem.id)
      form.reset({
        category: skillItem.category,
        items: skillItem.items.map((item) => ({ name: item })),
        notes: skillItem.notes || '',
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error in handleEditSkill:', error)
      toast.error('Failed to open edit dialog')
    }
  }

  const handleDeleteSkill = async (skillId: number) => {
    if (!window.confirm('Are you sure you want to delete this skill category?')) {
      return
    }
    try {
      await dispatch(deleteSkill(skillId)).unwrap()
      toast.success('Skill category deleted successfully')
      dispatch(fetchSkill())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete skill'
      toast.error(errorMessage)
    }
  }

  const { watch, setValue } = form
  const items = watch('items') || []

  const onSubmit = async (data: SkillFormValues) => {
    setIsSubmitting(true)
    try {
      const itemsArray = data.items.map((item) => item.name)

      if (editingSkillId !== null) {
        // Update operation - handle notes with set_notes flag
        const updatePayload: {
          category: string
          items: string[]
          notes?: string | null
          set_notes?: boolean
        } = {
          category: data.category,
          items: itemsArray,
        }

        // Handle notes update logic
        const notesValue = data.notes?.trim() || ''
        if (notesValue === '') {
          // If notes is empty, check if we need to clear it
          // We need to check the original skill's notes to determine if we're clearing
          const originalSkill = skills.find((s) => s.id === editingSkillId)
          if (originalSkill?.notes) {
            // Original had notes, now empty - clear it
            updatePayload.notes = null
            updatePayload.set_notes = true
          }
          // If original had no notes and we're not providing any, omit both fields
        } else {
          // Notes has a value - update it
          updatePayload.notes = notesValue
        }

        await dispatch(
          updateSkill({
            skillId: editingSkillId,
            data: updatePayload,
          })
        ).unwrap()
        toast.success('Skill category updated successfully')
      } else {
        // Create operation - include notes if provided
        const createPayload: {
          category: string
          items: string[]
          notes?: string | null
        } = {
          category: data.category,
          items: itemsArray,
        }

        // Only include notes if it has a value
        const notesValue = data.notes?.trim() || ''
        if (notesValue !== '') {
          createPayload.notes = notesValue
        }

        await dispatch(createSkill(createPayload)).unwrap()
        toast.success('Skill category created successfully')
      }

      setIsDialogOpen(false)
      setEditingSkillId(null)
      form.reset()
      dispatch(fetchSkill())
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to save skill'
      toast.error(errorMessage)
      console.error('Failed to save skill:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addItem = () => {
    const currentItems = items || []
    setValue('items', [...currentItems, { name: '' }], { shouldValidate: false })
  }

  const removeItem = (index: number) => {
    const currentItems = items || []
    setValue('items', currentItems.filter((_, i) => i !== index), { shouldValidate: true })
  }

  // Show error in toast if there's an error and no skills data (only once)
  useEffect(() => {
    if (error && skills.length === 0 && !loading) {
      toast.error(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (loading && skills.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Skills</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Skills</h1>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Manage your skills by category
        </p>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Skill Category
        </Button>
      </div>

      {skills.length > 0 ? (
        <div className="grid gap-6">
          {skills.map((skillItem, index) => (
            <div
              key={skillItem.id || index}
              className="group relative border rounded-xl p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-1">{skillItem.category}</h2>
                      <p className="text-sm text-muted-foreground">
                        {skillItem.items.join(', ')}
                      </p>
                      {skillItem.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Notes: {skillItem.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditSkill(skillItem)
                      }}
                      className="shrink-0 hover:bg-primary/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteSkill(skillItem.id)
                      }}
                      className="shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
              <Code className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">No Skills Added</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              Get started by adding your skills organized by category.
            </p>
            <Button onClick={handleOpenDialog} size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Skill Category
            </Button>
          </div>
        </div>
      )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingSkillId(null)
            form.reset({
              category: '',
              items: [],
              notes: '',
            })
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingSkillId !== null ? 'Edit Skill Category' : 'Add Skill Category'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingSkillId !== null
                ? 'Update your skill category and items.'
                : 'Add a new skill category with items.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Category Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Category</h3>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Category Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Languages, Frameworks, Tools"
                          maxLength={20}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 20 characters. Only alphabets, numbers, spaces, and commas allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {items.map((_, index) => (
                  <div key={index} className="flex gap-2 p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Python, React, Docker"
                              maxLength={20}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum 20 characters. Only alphabets, numbers, spaces, hyphens, and plus signs allowed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="shrink-0 mt-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items added. Click "Add Item" to add one.
                  </p>
                )}
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Personal Notes</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="Add personal notes for reference (not shown in generated resumes)"
                          className="mt-2 min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Personal notes for your reference. These will not appear in generated resumes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingSkillId(null)
                    form.reset({
                      category: '',
                      items: [],
                      notes: '',
                    })
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

export default Skills
