import pdfplumber
import json
import fitz  # PyMuPDF
import io
from openai import AsyncOpenAI
from app.settings.get_env import OPENAI_API_KEY
from app.models.ai import ExtractedResumeData
from typing import Tuple

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using pdfplumber"""
    try:
        text_content = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
        return "\n\n".join(text_content)
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def convert_first_page_to_image(file_path: str, zoom: float = 2.0) -> bytes:
    """Convert the first page of PDF to PNG image bytes"""
    try:
        # Open PDF with PyMuPDF
        pdf_document = fitz.open(file_path)
        
        if len(pdf_document) == 0:
            raise Exception("PDF has no pages")
        
        # Get first page
        first_page = pdf_document[0]
        
        # Set zoom for better quality (2.0 = 200% zoom)
        mat = fitz.Matrix(zoom, zoom)
        
        # Render page to pixmap (image)
        pix = first_page.get_pixmap(matrix=mat)
        
        # Convert to PNG bytes
        img_bytes = pix.tobytes("png")
        
        # Close document
        pdf_document.close()
        
        return img_bytes
    except Exception as e:
        raise Exception(f"Failed to convert PDF page to image: {str(e)}")

async def extract_resume_data_with_openai(pdf_text: str) -> Tuple[ExtractedResumeData, int]:
    """Extract structured resume data from PDF text using OpenAI GPT-4o-mini"""
    prompt = """Extract all resume information from the following text and return it as a JSON object with this exact structure:

{
  "heading": {
    "mobile": "string or null",
    "custom_links": [{"label": "string", "url": "string"}]
  },
  "experiences": [
    {
      "company": "string",
      "location": "string",
      "position": "string",
      "start_date": "string",
      "end_date": "string",
      "projects": [{"title": "string", "description": "string"}]
    }
  ],
  "projects": [
    {
      "name": "string",
      "start_date": "string",
      "end_date": "string",
      "tech_stack": "string",
      "link": "string or null",
      "link_label": "string or null",
      "subpoints": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "location": "string",
      "degree": "string",
      "gpa": "number or null",
      "max_gpa": "number or null",
      "start_date": "string",
      "end_date": "string",
      "courses": ["string"] or null
    }
  ],
  "skills": [
    {
      "category": "string",
      "items": ["string"]
    }
  ],
  "certifications": [
    {
      "title": "string",
      "start_date": "string",
      "end_date": "string",
      "instructor": "string or null",
      "platform": "string",
      "certification_link": "string or null"
    }
  ],
  "awards": [
    {
      "title": "string",
      "date": "string"
    }
  ],
  "volunteer_experiences": [
    {
      "position": "string",
      "organization": "string",
      "location": "string",
      "description": "string",
      "start_date": "string",
      "end_date": "string"
    }
  ]
}

Extraction rules:
- If a section is not found, use null for objects or empty arrays [] for lists
- Dates can be in various formats (e.g., "Jan 2020", "2020-01", "Present") - preserve the original format
- For GPA, extract both the GPA value and max GPA if mentioned
- For skills, group them by category (Languages, Frameworks, Tools, Soft Skills, etc.)
- For projects in experience, extract project title and description
- Be thorough and extract all available information
- Return ONLY valid JSON, no additional text

Resume text:
"""
    prompt += pdf_text
    
    try:
        # Use JSON mode for structured output
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting structured data from resumes. Always return valid JSON that matches the exact schema provided."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,  # Low temperature for more consistent extraction
            max_tokens=4000
        )
        
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        # Parse JSON and validate with Pydantic
        try:
            json_data = json.loads(content)
            extracted_data = ExtractedResumeData(**json_data)
            return extracted_data, tokens_used
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse OpenAI response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to validate extracted data: {str(e)}")
            
    except Exception as e:
        if "Failed to" in str(e):
            raise e
        raise Exception(f"Failed to extract resume data with OpenAI: {str(e)}")
