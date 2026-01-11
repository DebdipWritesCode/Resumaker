// TypeScript interfaces for extracted resume data
export interface CustomLink {
  label: string
  url: string
}

export interface HeadingData {
  mobile: string | null
  custom_links: CustomLink[] | null
}

export interface ExperienceProject {
  title: string
  description: string
}

export interface ExperienceData {
  company: string
  location: string
  position: string
  start_date: string
  end_date: string
  projects: ExperienceProject[] | null
}

export interface ProjectData {
  name: string
  start_date: string
  end_date: string
  tech_stack: string
  link: string | null
  link_label: string | null
  subpoints: string[] | null
}

export interface EducationData {
  institution: string
  location: string
  degree: string
  gpa: string | null
  max_gpa: string | null
  start_date: string
  end_date: string
  courses: string[] | null
}

export interface SkillData {
  category: string
  items: string[]
}

export interface CertificationData {
  title: string
  start_date: string
  end_date: string
  instructor: string | null
  platform: string
  certification_link: string | null
}

export interface AwardData {
  title: string
  date: string
}

export interface VolunteerExperienceData {
  position: string
  organization: string
  location: string
  description: string
  start_date: string
  end_date: string
}

export interface ExtractedResumeData {
  heading: HeadingData | null
  experiences: ExperienceData[] | null
  projects: ProjectData[] | null
  education: EducationData[] | null
  skills: SkillData[] | null
  certifications: CertificationData[] | null
  awards: AwardData[] | null
  volunteer_experiences: VolunteerExperienceData[] | null
}
