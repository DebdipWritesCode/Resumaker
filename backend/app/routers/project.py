from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_projects_collection

router = APIRouter(prefix="/api/project", tags=["Project"])

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get all user's projects"""
    projects_collection = get_projects_collection()
    cursor = projects_collection.find({"user_id": ObjectId(current_user["user_id"])})
    projects = await cursor.to_list(length=None)
    
    return [
        ProjectResponse(
            id=str(project["_id"]),
            user_id=str(project["user_id"]),
            name=project["name"],
            start_date=project["start_date"],
            end_date=project["end_date"],
            tech_stack=project["tech_stack"],
            link=project.get("link"),
            link_label=project.get("link_label"),
            subpoints=project.get("subpoints", []),
            created_at=project["created_at"],
            updated_at=project["updated_at"]
        )
        for project in projects
    ]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific project by ID"""
    projects_collection = get_projects_collection()
    
    try:
        project_object_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    project = await projects_collection.find_one({
        "_id": project_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return ProjectResponse(
        id=str(project["_id"]),
        user_id=str(project["user_id"]),
        name=project["name"],
        start_date=project["start_date"],
        end_date=project["end_date"],
        tech_stack=project["tech_stack"],
        link=project.get("link"),
        link_label=project.get("link_label"),
        subpoints=project.get("subpoints", []),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new project"""
    projects_collection = get_projects_collection()
    
    project_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "name": project_data.name,
        "start_date": project_data.start_date,
        "end_date": project_data.end_date,
        "tech_stack": project_data.tech_stack,
        "link": project_data.link,
        "link_label": project_data.link_label,
        "subpoints": project_data.subpoints or [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await projects_collection.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id
    
    return ProjectResponse(
        id=str(project_doc["_id"]),
        user_id=str(project_doc["user_id"]),
        name=project_doc["name"],
        start_date=project_doc["start_date"],
        end_date=project_doc["end_date"],
        tech_stack=project_doc["tech_stack"],
        link=project_doc["link"],
        link_label=project_doc["link_label"],
        subpoints=project_doc["subpoints"],
        created_at=project_doc["created_at"],
        updated_at=project_doc["updated_at"]
    )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific project by ID"""
    projects_collection = get_projects_collection()
    
    try:
        project_object_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    # Verify the project exists and belongs to the user
    project = await projects_collection.find_one({
        "_id": project_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if project_data.name is not None:
        update_data["name"] = project_data.name
    if project_data.start_date is not None:
        update_data["start_date"] = project_data.start_date
    if project_data.end_date is not None:
        update_data["end_date"] = project_data.end_date
    if project_data.tech_stack is not None:
        update_data["tech_stack"] = project_data.tech_stack
    if project_data.set_link or project_data.link is not None:
        update_data["link"] = project_data.link
    if project_data.set_link_label or project_data.link_label is not None:
        update_data["link_label"] = project_data.link_label
    if project_data.set_subpoints or project_data.subpoints is not None:
        update_data["subpoints"] = project_data.subpoints or []
    
    await projects_collection.update_one(
        {"_id": project_object_id},
        {"$set": update_data}
    )
    
    updated = await projects_collection.find_one({"_id": project_object_id})
    return ProjectResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        name=updated["name"],
        start_date=updated["start_date"],
        end_date=updated["end_date"],
        tech_stack=updated["tech_stack"],
        link=updated.get("link"),
        link_label=updated.get("link_label"),
        subpoints=updated.get("subpoints", []),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific project by ID"""
    projects_collection = get_projects_collection()
    
    try:
        project_object_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    # Verify the project exists and belongs to the user
    project = await projects_collection.find_one({
        "_id": project_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    await projects_collection.delete_one({"_id": project_object_id})
    return None
