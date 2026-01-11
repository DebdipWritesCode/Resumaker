import type { ExtractedResumeData } from '@/components/resume-extraction/types'

export interface UploadedResumeResponse {
  _id: string
  user_id: string
  cloudinary_url: string
  cloudinary_public_id: string
  thumbnail_url: string | null
  thumbnail_public_id: string | null
  extracted_data: ExtractedResumeData
  uploaded_at: string
  created_at: string
  updated_at: string
}
