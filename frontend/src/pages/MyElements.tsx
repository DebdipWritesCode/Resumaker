import { 
  Type, 
  GraduationCap, 
  Briefcase, 
  FolderKanban, 
  Code, 
  Award, 
  Trophy, 
  HeartHandshake 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const MyElements = () => {
  const navigate = useNavigate()
  const elements = [
    {
      id: 'heading',
      title: 'Heading',
      description: 'Mobile number, Custom links',
      icon: Type,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Institution, Location, Degree, GPA, Dates, Courses',
      icon: GraduationCap,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      id: 'experience',
      title: 'Experience',
      description: 'Company, Location, Position, Dates, Projects',
      icon: Briefcase,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      id: 'projects',
      title: 'Projects',
      description: 'Name, Date range, Tech stack, GitHub link, Subpoints',
      icon: FolderKanban,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
    {
      id: 'skills',
      title: 'Skills',
      description: 'Category, Items (Languages, Frameworks, Tools, etc.)',
      icon: Code,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      id: 'certifications',
      title: 'Certifications',
      description: 'Title, Date range, Instructor, Platform, Link',
      icon: Award,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    },
    {
      id: 'awards',
      title: 'Awards',
      description: 'Title, Date',
      icon: Trophy,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    },
    {
      id: 'volunteer',
      title: 'Volunteer Experiences',
      description: 'Organization, Location, Description, Dates',
      icon: HeartHandshake,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    },
  ]

  const handleCardClick = (elementId: string) => {
    // Navigate to the specific element section
    const routes: Record<string, string> = {
      heading: '/my-elements/heading',
      education: '/my-elements/education',
      experience: '/my-elements/experience',
      projects: '/my-elements/projects',
      skills: '/my-elements/skills',
      certifications: '/my-elements/certifications',
      awards: '/my-elements/awards',
      // TODO: Add routes for other elements as they are implemented
      // volunteer: '/my-elements/volunteer',
    }

    const route = routes[elementId]
    if (route) {
      navigate(route)
    } else {
      console.log(`Route for ${elementId} not yet implemented`)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Elements</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your resume elements. Click on a card to view, add, edit, or update data.
          </p>
          <Button
            variant="default"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              // TODO: Implement Add From Resume functionality
              console.log('Add From Resume clicked')
            }}
          >
            Add From Resume
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {elements.map((element) => {
          const Icon = element.icon
          return (
            <Button
              key={element.id}
              variant="ghost"
              className={`h-auto p-6 flex flex-col items-start gap-4 border-2 border-border hover:border-primary/50 transition-all duration-200 ${element.bgColor} hover:shadow-lg overflow-visible`}
              onClick={() => handleCardClick(element.id)}
            >
              <div className={`p-3 rounded-lg ${element.bgColor} border border-border/50`}>
                <Icon className={`h-6 w-6 ${element.color}`} />
              </div>
              <div className="flex-1 w-full text-left min-w-0">
                <h3 className="text-lg font-semibold mb-2">{element.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-normal">
                  {element.description}
                </p>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default MyElements
