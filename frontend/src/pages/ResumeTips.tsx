import { Link2, MapPin, Calendar, ArrowDown, CheckCircle, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ResumeTip {
  id: number
  icon: typeof Link2
  title: string
  description: string
  image: string
  color: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
}

const tips: ResumeTip[] = [
  {
    id: 1,
    icon: Link2,
    title: 'Ensure Links Are Clickable and Valid',
    description:
      'Make sure all links in your resume are clickable and lead to valid, accessible pages. Include at least two professional links such as GitHub, LinkedIn, portfolio, or LeetCode profiles. These links help recruiters verify your work and learn more about your skills and projects. Always test your links before submitting your resume to ensure they work correctly.',
    image: '/resume_tips/1.png',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    gradientFrom: 'from-blue-500/10',
    gradientTo: 'to-blue-600/5',
  },
  {
    id: 2,
    icon: MapPin,
    title: 'Use Consistent Location Format',
    description:
      'Always format locations in the standard format: City, State, Country. This consistency makes your resume look professional and helps Applicant Tracking Systems (ATS) parse your information correctly. For example, use "San Francisco, California, USA" or "Bangalore, Karnataka, India" rather than mixing formats like "SF, CA" or "Bangalore, India".',
    image: '/resume_tips/2.png',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    gradientFrom: 'from-green-500/10',
    gradientTo: 'to-green-600/5',
  },
  {
    id: 3,
    icon: Calendar,
    title: 'Maintain Consistent Date Formatting',
    description:
      'Keep your date formatting consistent throughout your resume. If you use full month names (e.g., "August 2023"), use them everywhere. If you use abbreviated names (e.g., "Aug 2023"), stick with abbreviations. Never mix formats. Additionally, always write "Present" in full rather than abbreviating it as "Pre". Consistency in date formatting improves readability and ATS compatibility.',
    image: '/resume_tips/3.png',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    gradientFrom: 'from-purple-500/10',
    gradientTo: 'to-purple-600/5',
  },
  {
    id: 4,
    icon: ArrowDown,
    title: 'Order Resume Elements Chronologically',
    description:
      'Organize all resume sections in descending chronological order, with the most recent items first. Items with "Present" as the end date should always appear at the top of their respective sections. This format makes it easy for recruiters to quickly see your current and recent experience, which is typically the most relevant to their hiring decisions.',
    image: '/resume_tips/4.png',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    gradientFrom: 'from-orange-500/10',
    gradientTo: 'to-orange-600/5',
  },
  {
    id: 5,
    icon: CheckCircle,
    title: 'Include Metrics in Subpoints',
    description:
      'End all subpoints with a period for proper punctuation. More importantly, include quantifiable metrics in each bullet point to demonstrate your impact. Metrics can include percentages (e.g., "increased efficiency by 25%"), team sizes (e.g., "led a team of 4"), user counts, revenue figures, or any other relevant quantitative data. Metrics help ATS systems recognize achievements and make your accomplishments more concrete and impressive to recruiters.',
    image: '/resume_tips/5.png',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    gradientFrom: 'from-red-500/10',
    gradientTo: 'to-red-600/5',
  },
  {
    id: 6,
    icon: Zap,
    title: 'Start Subpoints with Strong, Unique Action Verbs',
    description:
      'Every subpoint should begin with a strong, impactful action verb that clearly demonstrates your contribution. Use powerful verbs like "Architected", "Orchestrated", "Spearheaded", "Engineered", or "Pioneered" instead of weak ones like "Did", "Made", or "Worked on". Most importantly, ensure each action verb is unique within the same section—avoid repeating the same verb multiple times. This variety showcases your diverse skill set and makes your resume more engaging to recruiters. Strong, unique action verbs help ATS systems identify key achievements and make your accomplishments stand out.',
    image: '/resume_tips/6.png',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    gradientFrom: 'from-indigo-500/10',
    gradientTo: 'to-indigo-600/5',
  },
]

const ResumeTips = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 sm:mb-16 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-full border border-blue-500/20">
            <span className="text-sm font-semibold bg-linear-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Professional Guide
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent leading-tight">
            Resume Tips
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Master these best practices to create an ATS-friendly resume that captures recruiters' attention
          </p>
        </div>

        {/* Tips Grid */}
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
          {tips.map((tip, index) => {
            const Icon = tip.icon
            const isEven = index % 2 === 0

            return (
              <div
                key={tip.id}
                className="group relative"
              >
                {/* Card Container */}
                <div className="relative rounded-3xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-xl shadow-slate-900/5 dark:shadow-black/20 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/10 dark:hover:shadow-black/40 hover:-translate-y-1">
                  {/* Background Gradient */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                    `bg-linear-to-br ${tip.gradientFrom} ${tip.gradientTo}`
                  )} />
                  
                  <div className="relative p-6 sm:p-8 lg:p-10">
                    {/* Content Grid */}
                    <div className={cn(
                      "grid lg:grid-cols-2 gap-8 lg:gap-12 items-start",
                      isEven ? "" : "lg:grid-flow-dense"
                    )}>
                      {/* Text Content */}
                      <div className={cn("space-y-6", isEven ? "" : "lg:col-start-2")}>
                        {/* Tip Number Badge */}
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                            tip.bgColor,
                            tip.color
                          )}>
                            {tip.id}
                          </div>
                          <div className="flex-1 pt-1">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                              {tip.title}
                            </h2>
                          </div>
                        </div>

                        {/* Icon Feature Box */}
                        <div className={cn(
                          "inline-flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
                          tip.bgColor,
                          "border-slate-200 dark:border-slate-700"
                        )}>
                          <div className="relative">
                            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", tip.color)} />
                          </div>
                          <span className={cn("font-semibold text-sm sm:text-base", tip.color)}>
                            Key Insight
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                          {tip.description}
                        </p>
                      </div>

                      {/* Image Content */}
                      <div className={cn("relative", isEven ? "" : "lg:col-start-1 lg:row-start-1")}>
                        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:border-slate-300 dark:group-hover:border-slate-600">
                          {/* Decorative corner accent */}
                          <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 opacity-20 transition-opacity duration-500 group-hover:opacity-40",
                            `bg-linear-to-br ${tip.gradientFrom} ${tip.gradientTo}`
                          )} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                          
                          <img
                            src={tip.image}
                            alt={tip.title}
                            className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    `bg-linear-to-br ${tip.gradientFrom} ${tip.gradientTo}`
                  )} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 sm:mt-20 text-center">
          <div className="inline-block p-8 rounded-2xl bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Ready to optimize your resume?
            </p>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Apply these tips to stand out in your next application
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeTips
