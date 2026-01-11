import { 
  Type, 
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExtractedResumeData } from './types'

interface Tab {
  id: string
  label: string
  icon: typeof Type
}

interface ExtractedResumeTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  extractedData: ExtractedResumeData
  tabValidationStatus?: Record<string, boolean>
}

export const ExtractedResumeTabs = ({
  tabs,
  activeTab,
  onTabChange,
  extractedData,
  tabValidationStatus = {}
}: ExtractedResumeTabsProps) => {
  const getCount = (tabId: string): number => {
    switch (tabId) {
      case 'heading':
        return extractedData.heading ? 1 : 0
      case 'experiences':
        return extractedData.experiences?.length || 0
      case 'projects':
        return extractedData.projects?.length || 0
      case 'education':
        return extractedData.education?.length || 0
      case 'skills':
        return extractedData.skills?.length || 0
      case 'certifications':
        return extractedData.certifications?.length || 0
      case 'awards':
        return extractedData.awards?.length || 0
      case 'volunteer':
        return extractedData.volunteer_experiences?.length || 0
      default:
        return 0
    }
  }

  return (
    <div className="w-full bg-background">
      <div className="px-6 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 min-w-max py-3">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id
            const count = getCount(tab.id)
            const hasError = tabValidationStatus[tab.id] === false

            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap transition-colors relative ${
                  isActive 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-muted'
                } ${
                  hasError && !isActive
                    ? 'border-2 border-destructive/50 bg-destructive/5'
                    : hasError && isActive
                    ? 'ring-2 ring-destructive/50 ring-offset-2'
                    : ''
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{tab.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
                {hasError && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
