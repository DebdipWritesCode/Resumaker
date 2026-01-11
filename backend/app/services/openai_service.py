from openai import OpenAI
from app.settings.get_env import OPENAI_API_KEY
from app.database import get_ai_usage_logs_collection
from datetime import datetime
from bson import ObjectId
from typing import Dict, List, Tuple
import json

client = OpenAI(api_key=OPENAI_API_KEY)

async def generate_subpoints(
    section: str,
    item_id: str,
    user_id: str,
    tech_stack: str = None,
    name: str = None
) -> tuple[list[str], int]:
    """Generate subpoints for a project or experience"""
    prompt = f"""Generate 3-4 professional bullet points for a resume {section} section.
"""
    if name:
        prompt += f"Name: {name}\n"
    if tech_stack:
        prompt += f"Tech Stack: {tech_stack}\n"
    
    prompt += """
Requirements:
- Start each bullet point with a strong action verb
- Include quantifiable achievements where possible
- Be specific and impactful
- Format as a simple list, one bullet per line
- Do not include bullet symbols or numbering
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional resume writer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        subpoints = [line.strip() for line in content.split("\n") if line.strip() and not line.strip().startswith(("-", "*", "•"))]
        
        tokens_used = response.usage.total_tokens
        
        # Log usage
        await log_ai_usage(user_id, "generate_subpoints", section, item_id, tokens_used)
        
        return subpoints, tokens_used
    except Exception as e:
        raise Exception(f"Failed to generate subpoints: {str(e)}")

async def rephrase_title(
    section: str,
    item_id: str,
    user_id: str,
    current_title: str
) -> tuple[str, int]:
    """Rephrase a title for better impact"""
    prompt = f"""Rephrase this resume {section} title to be more impactful and professional:

Current title: {current_title}

Requirements:
- Keep it concise (max 10 words)
- Use strong, action-oriented language
- Make it stand out
- Return only the rephrased title, nothing else
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional resume writer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50,
            temperature=0.7
        )
        
        rephrased_title = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens
        
        # Log usage
        await log_ai_usage(user_id, "rephrase_title", section, item_id, tokens_used)
        
        return rephrased_title, tokens_used
    except Exception as e:
        raise Exception(f"Failed to rephrase title: {str(e)}")

async def rephrase_subpoints(
    section: str,
    item_id: str,
    user_id: str,
    subpoints: list[str]
) -> tuple[list[str], int]:
    """Rephrase subpoints for clarity and professionalism"""
    subpoints_text = "\n".join([f"- {sp}" for sp in subpoints])
    prompt = f"""Rephrase these resume {section} bullet points to be more professional and impactful:

{subpoints_text}

Requirements:
- Start each bullet point with a strong action verb
- Include quantifiable achievements where possible
- Be specific and impactful
- Format as a simple list, one bullet per line
- Do not include bullet symbols or numbering
- Maintain the same number of bullet points
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional resume writer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        rephrased = [line.strip() for line in content.split("\n") if line.strip() and not line.strip().startswith(("-", "*", "•"))]
        
        tokens_used = response.usage.total_tokens
        
        # Log usage
        await log_ai_usage(user_id, "rephrase_subpoints", section, item_id, tokens_used)
        
        return rephrased, tokens_used
    except Exception as e:
        raise Exception(f"Failed to rephrase subpoints: {str(e)}")

async def rephrase_experience_project_description(
    user_id: str,
    title: str,
    current_description: str,
    validation_rule: str
) -> tuple[str, int]:
    """Rephrase an experience project description to be resume-friendly"""
    prompt = f"""Rephrase this experience project description to be more professional and impactful for a resume:

Project Title: {title}
Current Description: {current_description}

Validation Rule: {validation_rule}

Requirements:
- Start with a powerful action verb (e.g., Developed, Implemented, Designed, Optimized, Led)
- Include quantifiable metrics or numbers (percentages, amounts, timeframes, user counts, etc.)
- Be specific and impactful
- Use resume-friendly language
- End with a period
- Follow the validation rule strictly
- Make it concise but comprehensive
- Focus on achievements and impact, not just responsibilities

Return only the rephrased description, nothing else."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional resume writer specializing in creating impactful, metric-driven descriptions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        rephrased_description = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens
        
        # Log usage (no item_id for this operation)
        await log_ai_usage(user_id, "rephrase_experience_project", "experience", "temp", tokens_used)
        
        return rephrased_description, tokens_used
    except Exception as e:
        raise Exception(f"Failed to rephrase experience project description: {str(e)}")

async def rephrase_project_subpoints(
    user_id: str,
    title: str,
    current_subpoints: list[str],
    other_subpoints: list[str],
    validation_rule: str
) -> tuple[list[str], int]:
    """Rephrase project subpoints to be resume-friendly"""
    current_text = "\n".join([f"- {sp}" for sp in current_subpoints])
    other_text = "\n".join([f"- {sp}" for sp in other_subpoints]) if other_subpoints else "None"
    
    prompt = f"""Rephrase these project subpoints to be more professional and impactful for a resume:

Project Title: {title}

Current Subpoints to Rephrase:
{current_text}

Other Subpoints (for context and consistency):
{other_text}

Validation Rule: {validation_rule}

Requirements:
- Start each point with a powerful action verb (e.g., Developed, Implemented, Designed, Optimized, Led, Built)
- Include quantifiable metrics or numbers (percentages, amounts, timeframes, user counts, etc.)
- Be specific and impactful
- Use resume-friendly language
- End each point with a period
- Follow the validation rule strictly for each point
- Maintain consistency with the other subpoints in style and tone
- Format as a simple list, one point per line
- Do not include bullet symbols or numbering
- Maintain the same number of points as the current subpoints

Return only the rephrased subpoints, one per line, nothing else."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional resume writer specializing in creating impactful, metric-driven bullet points."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        rephrased = [line.strip() for line in content.split("\n") if line.strip() and not line.strip().startswith(("-", "*", "•", "1.", "2.", "3."))]
        
        tokens_used = response.usage.total_tokens
        
        # Log usage (no item_id for this operation)
        await log_ai_usage(user_id, "rephrase_project_subpoints", "project", "temp", tokens_used)
        
        return rephrased, tokens_used
    except Exception as e:
        raise Exception(f"Failed to rephrase project subpoints: {str(e)}")

async def rephrase_volunteer_description(
    user_id: str,
    title: str,
    current_description: str,
    validation_rule: str
) -> tuple[str, int]:
    """Rephrase a volunteer description to be resume-friendly"""
    prompt = f"""Rephrase this volunteer experience description to be more professional and impactful for a resume:

Position/Organization: {title}
Current Description: {current_description}

Validation Rule: {validation_rule}

Requirements:
- Start with a powerful action verb (e.g., Organized, Led, Coordinated, Managed, Facilitated)
- Include quantifiable metrics or numbers (number of people, events, hours, impact metrics, etc.)
- Be specific and impactful
- Use resume-friendly language
- End with a period
- Follow the validation rule strictly
- Make it concise but comprehensive
- Focus on achievements and impact, not just responsibilities

Return only the rephrased description, nothing else."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional resume writer specializing in creating impactful, metric-driven descriptions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        rephrased_description = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens
        
        # Log usage (no item_id for this operation)
        await log_ai_usage(user_id, "rephrase_volunteer_description", "volunteer", "temp", tokens_used)
        
        return rephrased_description, tokens_used
    except Exception as e:
        raise Exception(f"Failed to rephrase volunteer description: {str(e)}")

async def log_ai_usage(
    user_id: str,
    action_type: str,
    section: str,
    item_id: str,
    tokens_used: int
):
    """
    Log AI usage for analytics.
    
    This function:
    1. Inserts a log entry into the ai_usage_logs collection
    2. Updates user analytics in the users collection:
       - Increments ai_calls_count by 1
       - Adds tokens_used to the total tokens_used
       - Updates last_ai_call_at timestamp
    """
    ai_usage_logs_collection = get_ai_usage_logs_collection()
    # Handle case where item_id might be "temp" or empty for operations without saved items
    item_object_id = None
    if item_id and item_id != "temp":
        try:
            item_object_id = ObjectId(item_id)
        except Exception:
            # If item_id is not a valid ObjectId, skip it
            pass
    
    log_entry = {
        "user_id": ObjectId(user_id),
        "action_type": action_type,
        "section": section,
        "tokens_used": tokens_used,
        "created_at": datetime.utcnow()
    }
    
    if item_object_id:
        log_entry["item_id"] = item_object_id
    
    await ai_usage_logs_collection.insert_one(log_entry)
    
    # Update user analytics
    from app.database import get_users_collection
    users_collection = get_users_collection()
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$inc": {
                "analytics.ai_calls_count": 1,
                "analytics.tokens_used": tokens_used
            },
            "$set": {"analytics.last_ai_call_at": datetime.utcnow()}
        }
    )


async def select_resume_elements_for_job(
    user_id: str,
    job_description: str,
    projects: List[Dict],
    awards: List[Dict],
    certifications: List[Dict],
    volunteers: List[Dict]
) -> Tuple[Dict[str, List[str]], int]:
    """
    Use AI to select relevant resume elements based on job description.
    
    Args:
        user_id: User ID for logging
        job_description: The job description text
        projects: List of project documents from database
        awards: List of award documents from database
        certifications: List of certification documents from database
        volunteers: List of volunteer documents from database
    
    Returns:
        Tuple of (selected_ids_dict, tokens_used) where selected_ids_dict contains:
        - project_ids: List of selected project UUIDs
        - award_ids: List of selected award UUIDs
        - certification_ids: List of selected certification UUIDs
        - volunteer_ids: List of selected volunteer UUIDs
    """
    # Create mappings from UUIDs to simple numbers
    project_mapping = {}  # {simple_id: uuid}
    award_mapping = {}
    certification_mapping = {}
    volunteer_mapping = {}
    
    # Build simplified data for LLM
    projects_data = []
    for idx, project in enumerate(projects, 1):
        simple_id = str(idx)
        project_mapping[simple_id] = str(project["_id"])
        projects_data.append({
            "id": simple_id,
            "name": project.get("name", ""),
            "tech_stack": project.get("tech_stack", ""),
            "subpoints": project.get("subpoints", [])[:3]  # First 3 subpoints for context
        })
    
    awards_data = []
    for idx, award in enumerate(awards, 1):
        simple_id = str(idx)
        award_mapping[simple_id] = str(award["_id"])
        awards_data.append({
            "id": simple_id,
            "title": award.get("title", ""),
            "date": award.get("date", "")
        })
    
    certifications_data = []
    for idx, cert in enumerate(certifications, 1):
        simple_id = str(idx)
        certification_mapping[simple_id] = str(cert["_id"])
        certifications_data.append({
            "id": simple_id,
            "title": cert.get("title", ""),
            "platform": cert.get("platform", ""),
            "instructor": cert.get("instructor", "")
        })
    
    volunteers_data = []
    for idx, volunteer in enumerate(volunteers, 1):
        simple_id = str(idx)
        volunteer_mapping[simple_id] = str(volunteer["_id"])
        volunteers_data.append({
            "id": simple_id,
            "position": volunteer.get("position", ""),
            "organization": volunteer.get("organization", ""),
            "description": volunteer.get("description", "")
        })
    
    # Determine how many to select
    # Projects: 3 (or all if less than 3)
    num_projects = min(3, len(projects)) if len(projects) > 0 else 0
    
    # Awards: 3-4 (prefer 4 if available, otherwise 3, or all if less than 3)
    if len(awards) >= 4:
        num_awards = 4
    elif len(awards) >= 3:
        num_awards = 3
    else:
        num_awards = len(awards)
    
    # Certifications: 2 (or all if less than 2)
    num_certifications = min(2, len(certifications)) if len(certifications) > 0 else 0
    
    # Volunteers: 2 (or all if less than 2)
    num_volunteers = min(2, len(volunteers)) if len(volunteers) > 0 else 0
    
    # Build prompt sections only for available elements
    prompt_sections = []
    prompt_sections.append(f"""You are a professional resume consultant. Analyze the following job description and select the most relevant resume elements that best match the job requirements.

Job Description:
{job_description}

Available Resume Elements:""")
    
    if projects_data:
        prompt_sections.append(f"""
PROJECTS (Select {num_projects}):
{json.dumps(projects_data, indent=2)}""")
    
    if awards_data:
        prompt_sections.append(f"""
AWARDS (Select {num_awards}):
{json.dumps(awards_data, indent=2)}""")
    
    if certifications_data:
        prompt_sections.append(f"""
CERTIFICATIONS (Select {num_certifications}):
{json.dumps(certifications_data, indent=2)}""")
    
    if volunteers_data:
        prompt_sections.append(f"""
VOLUNTEER EXPERIENCES (Select {num_volunteers}):
{json.dumps(volunteers_data, indent=2)}""")
    
    prompt_sections.append("""
Instructions:
- Select the elements that are most relevant to the job description
- Prioritize elements that demonstrate skills, technologies, or achievements mentioned in the job description
- If fewer elements are available than requested, select all available
- Return your selection as a JSON object with this exact structure:
{
  "projects": ["1", "2", "3"],
  "awards": ["1", "2", "3", "4"],
  "certifications": ["1", "2"],
  "volunteers": ["1", "2"]
}
- Only include arrays for element types that were provided above
- Use empty arrays [] for element types that were not provided

Return ONLY valid JSON, no additional text or explanation.""")
    
    prompt = "\n".join(prompt_sections)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert resume consultant. Analyze job descriptions and select the most relevant resume elements. Always return valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Lower temperature for more consistent selection
            max_tokens=1000
        )
        
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        # Parse JSON response
        try:
            selected_simple_ids = json.loads(content)
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse OpenAI response as JSON: {str(e)}")
        
        # Map simple IDs back to UUIDs
        selected_uuids = {
            "project_ids": [project_mapping[id] for id in selected_simple_ids.get("projects", []) if id in project_mapping],
            "award_ids": [award_mapping[id] for id in selected_simple_ids.get("awards", []) if id in award_mapping],
            "certification_ids": [certification_mapping[id] for id in selected_simple_ids.get("certifications", []) if id in certification_mapping],
            "volunteer_ids": [volunteer_mapping[id] for id in selected_simple_ids.get("volunteers", []) if id in volunteer_mapping]
        }
        
        # Log AI usage to both ai_usage_logs collection and update user analytics
        # This increments ai_calls_count and adds tokens_used to user analytics
        await log_ai_usage(user_id, "select_resume_elements", "custom_resume", "temp", tokens_used)
        
        return selected_uuids, tokens_used
        
    except Exception as e:
        if "Failed to" in str(e):
            raise e
        raise Exception(f"Failed to select resume elements with OpenAI: {str(e)}")

