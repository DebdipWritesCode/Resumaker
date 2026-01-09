from openai import OpenAI
from app.settings.get_env import OPENAI_API_KEY
from app.database import get_ai_usage_logs_collection
from datetime import datetime
from bson import ObjectId

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

async def log_ai_usage(
    user_id: str,
    action_type: str,
    section: str,
    item_id: str,
    tokens_used: int
):
    """Log AI usage for analytics"""
    ai_usage_logs_collection = get_ai_usage_logs_collection()
    await ai_usage_logs_collection.insert_one({
        "user_id": ObjectId(user_id),
        "action_type": action_type,
        "section": section,
        "item_id": ObjectId(item_id),
        "tokens_used": tokens_used,
        "created_at": datetime.utcnow()
    })
    
    # Update user analytics
    from app.database import get_users_collection
    users_collection = get_users_collection()
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$inc": {"analytics.ai_calls_count": 1},
            "$set": {"analytics.last_ai_call_at": datetime.utcnow()}
        }
    )

