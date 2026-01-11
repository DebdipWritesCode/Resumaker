import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { customResumeApi, type CustomResume } from '@/api/custom-resume'
import { Loader2 } from 'lucide-react'

const PublicResume = () => {
  const { id } = useParams<{ id: string }>()
  const [resume, setResume] = useState<CustomResume | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const resumeData = await customResumeApi.getResumeById(id)
        setResume(resumeData)
      } catch (error) {
        console.error('Error fetching resume:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResume()
  }, [id])

  useEffect(() => {
    if (resume && resume.pdf_url) {
      // Set up meta tags for Open Graph and social media previews
      const currentUrl = `${window.location.origin}/resume/${resume.id}`
      const resumeName = resume.name || 'Resume'
      const description = `Latest professional resume: ${resumeName}`
      const imageUrl = resume.thumbnail_url || ''
      
      // Update document title
      document.title = `${resumeName} – Resume`
      
      // Remove existing meta tags
      const existingMetaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[http-equiv="refresh"]')
      existingMetaTags.forEach(tag => tag.remove())
      
      // Create and add Open Graph meta tags
      const metaTags = [
        // Open Graph
        { property: 'og:title', content: `${resumeName} – Resume` },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: currentUrl },
        ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${resumeName} – Resume` },
        { name: 'twitter:description', content: description },
        ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
        
        // Meta refresh for instant redirect (0 seconds = immediate)
        { 'http-equiv': 'refresh', content: `0;url=${resume.pdf_url}` },
      ]
      
      metaTags.forEach(({ property, name, 'http-equiv': httpEquiv, content }) => {
        const meta = document.createElement('meta')
        if (property) meta.setAttribute('property', property)
        if (name) meta.setAttribute('name', name)
        if (httpEquiv) meta.setAttribute('http-equiv', httpEquiv)
        meta.setAttribute('content', content)
        document.head.appendChild(meta)
      })
      
      // Also set a fallback redirect via JavaScript (for browsers that don't respect meta refresh)
      const redirectTimer = setTimeout(() => {
        window.location.href = resume.pdf_url!
      }, 100)
      
      return () => {
        clearTimeout(redirectTimer)
      }
    }
  }, [resume])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    )
  }

  if (!resume || !resume.pdf_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Resume not found</p>
        </div>
      </div>
    )
  }

  const resumeName = resume.name || 'Resume'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-2 text-foreground">{resumeName}</h1>
        <p className="text-sm text-muted-foreground mb-6">Redirecting to resume PDF...</p>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          If you are not redirected automatically,{' '}
          <a 
            href={resume.pdf_url} 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>
        </p>
      </div>
    </div>
  )
}

export default PublicResume
