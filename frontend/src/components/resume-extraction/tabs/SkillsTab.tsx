import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SkillData } from '../types'

interface SkillsTabProps {
  data: SkillData[]
  onUpdate: (data: SkillData[]) => void
}

export const SkillsTab = ({ data, onUpdate }: SkillsTabProps) => {
  const [skills, setSkills] = useState<SkillData[]>(data)

  useEffect(() => {
    setSkills(data)
  }, [data])

  const updateSkill = (index: number, field: keyof SkillData, value: any) => {
    const updated = [...skills]
    updated[index] = { ...updated[index], [field]: value }
    setSkills(updated)
    onUpdate(updated)
  }

  const addSkill = () => {
    const newSkill: SkillData = {
      category: '',
      items: []
    }
    const updated = [...skills, newSkill]
    setSkills(updated)
    onUpdate(updated)
  }

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index)
    setSkills(updated)
    onUpdate(updated)
  }

  const addItem = (skillIndex: number) => {
    const updated = [...skills]
    updated[skillIndex].items.push('')
    setSkills(updated)
    onUpdate(updated)
  }

  const removeItem = (skillIndex: number, itemIndex: number) => {
    const updated = [...skills]
    updated[skillIndex].items = updated[skillIndex].items.filter((_, i) => i !== itemIndex)
    setSkills(updated)
    onUpdate(updated)
  }

  const updateItem = (skillIndex: number, itemIndex: number, value: string) => {
    const updated = [...skills]
    updated[skillIndex].items[itemIndex] = value
    setSkills(updated)
    onUpdate(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Skills</h3>
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skill categories added</p>
      ) : (
        <div className="space-y-4">
          {skills.map((skill, skillIndex) => (
            <div key={`skill-${skillIndex}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Category {skillIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSkill(skillIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category Name</label>
                <Input
                  value={skill.category}
                  onChange={(e) => updateSkill(skillIndex, 'category', e.target.value)}
                  placeholder="Languages, Frameworks, Tools, etc."
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Items</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addItem(skillIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                {skill.items.length > 0 ? (
                  <div className="space-y-2">
                    {skill.items.map((item, itemIndex) => (
                      <div key={`skill-${skillIndex}-item-${itemIndex}`} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateItem(skillIndex, itemIndex, e.target.value)}
                          placeholder="Item name"
                          maxLength={20}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(skillIndex, itemIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No items added</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
