from typing import Dict, List, Tuple
from bson import ObjectId
from datetime import datetime
from app.models.ai import ExtractedResumeData
from app.models.heading import HeadingCreate, CustomLink
from app.models.experience import ExperienceCreate, ProjectItem
from app.models.project import ProjectCreate
from app.models.education import EducationCreate
from app.models.skill import SkillCreate
from app.models.certification import CertificationCreate
from app.models.award import AwardCreate
from app.models.volunteer import VolunteerCreate
from app.database import (
    get_headings_collection,
    get_experiences_collection,
    get_projects_collection,
    get_educations_collection,
    get_skills_collection,
    get_certifications_collection,
    get_awards_collection,
    get_volunteer_experiences_collection
)

async def save_extracted_resume_data(
    extracted_data: ExtractedResumeData,
    user_id: str
) -> Dict[str, any]:
    """
    Save extracted resume data to database collections.
    Returns dictionary with created IDs.
    Implements transactional behavior - if any save fails, rolls back all inserts.
    """
    user_object_id = ObjectId(user_id)
    inserted_records: List[Tuple[str, ObjectId]] = []  # (collection_name, document_id)
    
    result = {
        "heading_id": None,
        "experience_ids": [],
        "project_ids": [],
        "education_ids": [],
        "skill_ids": [],
        "certification_ids": [],
        "award_ids": [],
        "volunteer_ids": []
    }
    
    try:
        # Save Heading
        if extracted_data.heading is not None:
            try:
                headings_collection = get_headings_collection()
                custom_links = [
                    CustomLink(label=link.label, url=link.url)
                    for link in extracted_data.heading.custom_links
                ]
                
                heading_doc = {
                    "user_id": user_object_id,
                    "mobile": extracted_data.heading.mobile,
                    "custom_links": [link.dict() for link in custom_links],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                heading_result = await headings_collection.insert_one(heading_doc)
                heading_id = heading_result.inserted_id
                inserted_records.append(("headings", heading_id))
                result["heading_id"] = str(heading_id)
            except Exception as e:
                raise Exception(f"Failed to save heading: {str(e)}")
        
        # Save Experiences
        if extracted_data.experiences:
            try:
                experiences_collection = get_experiences_collection()
                for exp in extracted_data.experiences:
                    projects = [
                        ProjectItem(title=proj.title, description=proj.description)
                        for proj in exp.projects
                    ]
                    
                    experience_doc = {
                        "user_id": user_object_id,
                        "company": exp.company,
                        "location": exp.location,
                        "position": exp.position,
                        "start_date": exp.start_date,
                        "end_date": exp.end_date,
                        "projects": [proj.dict() for proj in projects],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    exp_result = await experiences_collection.insert_one(experience_doc)
                    exp_id = exp_result.inserted_id
                    inserted_records.append(("experiences", exp_id))
                    result["experience_ids"].append(str(exp_id))
            except Exception as e:
                raise Exception(f"Failed to save experiences: {str(e)}")
        
        # Save Projects
        if extracted_data.projects:
            try:
                projects_collection = get_projects_collection()
                for proj in extracted_data.projects:
                    project_doc = {
                        "user_id": user_object_id,
                        "name": proj.name,
                        "start_date": proj.start_date,
                        "end_date": proj.end_date,
                        "tech_stack": proj.tech_stack,
                        "link": proj.link,
                        "link_label": proj.link_label,
                        "subpoints": proj.subpoints or [],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    proj_result = await projects_collection.insert_one(project_doc)
                    proj_id = proj_result.inserted_id
                    inserted_records.append(("projects", proj_id))
                    result["project_ids"].append(str(proj_id))
            except Exception as e:
                raise Exception(f"Failed to save projects: {str(e)}")
        
        # Save Education
        if extracted_data.education:
            try:
                educations_collection = get_educations_collection()
                for edu in extracted_data.education:
                    education_doc = {
                        "user_id": user_object_id,
                        "institution": edu.institution,
                        "location": edu.location,
                        "degree": edu.degree,
                        "gpa": edu.gpa,
                        "max_gpa": edu.max_gpa,
                        "start_date": edu.start_date,
                        "end_date": edu.end_date,
                        "courses": edu.courses or [],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    edu_result = await educations_collection.insert_one(education_doc)
                    edu_id = edu_result.inserted_id
                    inserted_records.append(("educations", edu_id))
                    result["education_ids"].append(str(edu_id))
            except Exception as e:
                raise Exception(f"Failed to save education: {str(e)}")
        
        # Save Skills
        if extracted_data.skills:
            try:
                skills_collection = get_skills_collection()
                for skill in extracted_data.skills:
                    skill_doc = {
                        "user_id": user_object_id,
                        "category": skill.category,
                        "items": skill.items or [],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    skill_result = await skills_collection.insert_one(skill_doc)
                    skill_id = skill_result.inserted_id
                    inserted_records.append(("skills", skill_id))
                    result["skill_ids"].append(str(skill_id))
            except Exception as e:
                raise Exception(f"Failed to save skills: {str(e)}")
        
        # Save Certifications
        if extracted_data.certifications:
            try:
                certifications_collection = get_certifications_collection()
                for cert in extracted_data.certifications:
                    certification_doc = {
                        "user_id": user_object_id,
                        "title": cert.title,
                        "start_date": cert.start_date,
                        "end_date": cert.end_date,
                        "instructor": cert.instructor,
                        "platform": cert.platform,
                        "certification_link": cert.certification_link,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    cert_result = await certifications_collection.insert_one(certification_doc)
                    cert_id = cert_result.inserted_id
                    inserted_records.append(("certifications", cert_id))
                    result["certification_ids"].append(str(cert_id))
            except Exception as e:
                raise Exception(f"Failed to save certifications: {str(e)}")
        
        # Save Awards
        if extracted_data.awards:
            try:
                awards_collection = get_awards_collection()
                for award in extracted_data.awards:
                    award_doc = {
                        "user_id": user_object_id,
                        "title": award.title,
                        "date": award.date,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    award_result = await awards_collection.insert_one(award_doc)
                    award_id = award_result.inserted_id
                    inserted_records.append(("awards", award_id))
                    result["award_ids"].append(str(award_id))
            except Exception as e:
                raise Exception(f"Failed to save awards: {str(e)}")
        
        # Save Volunteer Experiences
        if extracted_data.volunteer_experiences:
            try:
                volunteers_collection = get_volunteer_experiences_collection()
                for vol in extracted_data.volunteer_experiences:
                    volunteer_doc = {
                        "user_id": user_object_id,
                        "position": vol.position,
                        "organization": vol.organization,
                        "location": vol.location,
                        "description": vol.description,
                        "start_date": vol.start_date,
                        "end_date": vol.end_date,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    vol_result = await volunteers_collection.insert_one(volunteer_doc)
                    vol_id = vol_result.inserted_id
                    inserted_records.append(("volunteer_experiences", vol_id))
                    result["volunteer_ids"].append(str(vol_id))
            except Exception as e:
                raise Exception(f"Failed to save volunteer experiences: {str(e)}")
        
        return result
        
    except Exception as e:
        # Rollback: Delete all inserted records
        await _rollback_inserts(inserted_records)
        raise e

async def _rollback_inserts(inserted_records: List[Tuple[str, ObjectId]]):
    """Delete all inserted records in reverse order"""
    collection_map = {
        "headings": get_headings_collection,
        "experiences": get_experiences_collection,
        "projects": get_projects_collection,
        "educations": get_educations_collection,
        "skills": get_skills_collection,
        "certifications": get_certifications_collection,
        "awards": get_awards_collection,
        "volunteer_experiences": get_volunteer_experiences_collection
    }
    
    # Delete in reverse order
    for collection_name, doc_id in reversed(inserted_records):
        try:
            collection = collection_map[collection_name]()
            await collection.delete_one({"_id": doc_id})
        except Exception:
            # Continue rollback even if individual deletes fail
            pass
