import os
from typing import List
from app.models.custom_resume import CustomResumeResponse
from app.models.user import UserResponse
from app.models.heading import HeadingResponse
from app.models.education import EducationResponse
from app.models.experience import ExperienceResponse
from app.models.project import ProjectResponse
from app.models.skill import SkillResponse
from app.models.certification import CertificationResponse
from app.models.award import AwardResponse
from app.models.volunteer import VolunteerResponse


def escape_latex(text: str) -> str:
    """
    Escape LaTeX special characters in text.
    Special characters: &, %, $, #, ^, _, {, }, ~, \
    """
    if not text:
        return ""
    
    # Replace backslash first (since we'll use it for escaping)
    text = text.replace("\\", "\\textbackslash{}")
    # Replace other special characters
    text = text.replace("&", "\\&")
    text = text.replace("%", "\\%")
    text = text.replace("$", "\\$")
    text = text.replace("#", "\\#")
    text = text.replace("^", "\\textasciicircum{}")
    text = text.replace("_", "\\_")
    text = text.replace("{", "\\{")
    text = text.replace("}", "\\}")
    text = text.replace("~", "\\textasciitilde{}")
    
    return text


def format_date_range(start_date: str, end_date: str) -> str:
    """Format date range for LaTeX"""
    start = escape_latex(start_date)
    end = escape_latex(end_date)
    return f"{start} -- {end}"


def generate_heading_section(headings: List[HeadingResponse], user: UserResponse) -> str:
    """Generate LaTeX heading section"""
    if not headings:
        # Use user data if no heading provided
        full_name = f"{user.first_name} {user.last_name}"
        email = user.email
        mobile = ""
        custom_links = []
    else:
        # Use first heading (assuming one heading per resume)
        heading = headings[0]
        full_name = f"{user.first_name} {user.last_name}"
        email = user.email
        mobile = heading.mobile or ""
        custom_links = heading.custom_links or []
    
    # Build heading LaTeX
    lines = []
    lines.append("\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}")
    
    # Name and email line
    name_escaped = escape_latex(full_name)
    email_escaped = escape_latex(email)
    lines.append(f"  \\textbf{{\\LARGE {name_escaped}}} & Email: \\href{{mailto:{email}}}{{{email_escaped}}}\\\\")
    
    # Custom links and mobile
    link_lines = []
    for link in custom_links:
        url = link.url
        url_escaped = escape_latex(url)
        # Determine link type for formatting - use full URL instead of label
        if "linkedin" in url.lower():
            link_lines.append(f"  \\href{{{url}}}{{LinkedIn: {url_escaped}}}")
        elif "github" in url.lower():
            link_lines.append(f"  \\href{{{url}}}{{GitHub: ~~{url_escaped}}}")
        else:
            # For other links, use label if available, otherwise URL
            label = escape_latex(link.label) if link.label else url_escaped
            link_lines.append(f"  \\href{{{url}}}{{{label}}}")
    
    # Second line: links (left) and mobile (right)
    if link_lines and mobile:
        mobile_escaped = escape_latex(mobile)
        lines.append(" \\\\".join(link_lines) + f" & Mobile:~~~{mobile_escaped} \\\\")
    elif link_lines:
        lines.append(" \\\\".join(link_lines) + " \\\\")
    elif mobile:
        mobile_escaped = escape_latex(mobile)
        lines.append(f"  & Mobile:~~~{mobile_escaped} \\\\")
    
    lines.append("\\end{tabular*}")
    
    return "\n".join(lines)


def generate_education_section(educations: List[EducationResponse]) -> str:
    """Generate LaTeX education section"""
    if not educations:
        return ""
    
    lines = []
    lines.append("%-----------EDUCATION-----------------")
    lines.append("\\section{Education}")
    lines.append("  \\resumeSubHeadingListStart")
    
    for edu in educations:
        institution = escape_latex(edu.institution)
        location = escape_latex(edu.location)
        degree = escape_latex(edu.degree)
        
        # Build degree line with GPA if available
        degree_line = degree
        if edu.gpa is not None and edu.max_gpa is not None:
            degree_line += f";  GPA: {edu.gpa}/{edu.max_gpa}"
        elif edu.gpa is not None:
            degree_line += f";  GPA: {edu.gpa}"
        
        date_range = format_date_range(edu.start_date, edu.end_date)
        
        lines.append("    \\resumeSubheading")
        lines.append(f"      {{{institution}}}{{{location}}}")
        lines.append(f"      {{{degree_line}}}{{{date_range}}}")
        
        # Add courses if available
        if edu.courses:
            courses_text = ", ".join([escape_latex(course) for course in edu.courses])
            lines.append(f"      {{\\scriptsize \\textit{{ \\footnotesize{{\\newline{{}}\\textbf{{Courses:}} {courses_text}}}}}}}")
    
    lines.append("  \\resumeSubHeadingListEnd")
    
    return "\n".join(lines)


def generate_experience_section(experiences: List[ExperienceResponse]) -> str:
    """Generate LaTeX experience section"""
    if not experiences:
        return ""
    
    lines = []
    lines.append("%-----------EXPERIENCE-----------------")
    lines.append("\\vspace{-5pt}")
    lines.append("\\section{Experience}")
    lines.append("  \\resumeSubHeadingListStart")
    lines.append("\\vspace{3pt}")
    
    for exp in experiences:
        company = escape_latex(exp.company)
        location = escape_latex(exp.location)
        position = escape_latex(exp.position)
        date_range = format_date_range(exp.start_date, exp.end_date)
        
        lines.append("        \\resumeSubheading")
        lines.append(f"  {{{company}}}{{{location}}}")
        lines.append(f"  {{{position}}}{{{date_range}}}")
        
        if exp.projects:
            lines.append("    \\resumeItemListStart")
            for project in exp.projects:
                title = escape_latex(project.title)
                description = escape_latex(project.description)
                lines.append(f"        \\resumeItem{{{title}}}")
                lines.append(f"          {{{description}}}")
            lines.append("      \\resumeItemListEnd")
    
    lines.append("\\resumeSubHeadingListEnd")
    
    return "\n".join(lines)


def generate_projects_section(projects: List[ProjectResponse]) -> str:
    """Generate LaTeX projects section"""
    if not projects:
        return ""
    
    lines = []
    lines.append("%-----------PROJECTS-----------------")
    lines.append("\\vspace{3pt}")
    lines.append("\\section{Projects}")
    lines.append("")
    
    for project in projects:
        name = escape_latex(project.name)
        date_range = format_date_range(project.start_date, project.end_date)
        tech_stack = escape_latex(project.tech_stack)
        tech_stack_formatted = f"Tech: {tech_stack}"
        
        # Build link if available
        link_text = ""
        if project.link:
            link_label = escape_latex(project.link_label or "Link")
            link_text = f"\\href{{{project.link}}}{{{link_label}}}"
        else:
            link_text = "{}"
        
        lines.append("\\resumeSubHeadingListStart")
        lines.append(f"    \\resumeSubheading{{{name}}}")
        lines.append(f"    {{{date_range}}}{{{tech_stack_formatted}}}")
        lines.append(f"    {{{link_text}}}")
        
        if project.subpoints:
            lines.append("    \\resumeItemListStart")
            for subpoint in project.subpoints:
                subpoint_escaped = escape_latex(subpoint)
                lines.append(f"        \\resumeItem{{}}")
                lines.append(f"          {{{subpoint_escaped}}}")
            lines.append("      \\resumeItemListEnd")
        
        lines.append("\\resumeSubHeadingListEnd")
    
    return "\n".join(lines)


def generate_skills_section(skills: List[SkillResponse]) -> str:
    """Generate LaTeX skills section"""
    if not skills:
        return ""
    
    lines = []
    lines.append("%-----------SKILLS SUMMARY-----------------")
    lines.append("\\vspace{-5pt}")
    lines.append("\\section{Skills Summary}")
    lines.append("\t\\resumeSubHeadingListStart")
    
    for skill in skills:
        category = escape_latex(skill.category)
        items = ", ".join([escape_latex(item) for item in skill.items])
        
        # Determine spacing based on category length
        spacing = "~~~~~~" if len(category) <= 10 else "~~~~" if len(category) <= 15 else "~~"
        lines.append(f"\t\\resumeSubItem{{{category}}}{{{spacing}{items}}}")
    
    lines.append("\\resumeSubHeadingListEnd")
    
    return "\n".join(lines)


def generate_certifications_section(certifications: List[CertificationResponse]) -> str:
    """Generate LaTeX certifications section"""
    if not certifications:
        return ""
    
    lines = []
    lines.append("%-----------CERTIFICATIONS-----------------")
    lines.append("\\vspace{-5pt}")
    lines.append("\\section{Certifications}")
    
    for cert in certifications:
        title = escape_latex(cert.title)
        date_range = format_date_range(cert.start_date, cert.end_date)
        
        # Build instructor and platform line
        instructor = escape_latex(cert.instructor) if cert.instructor else ""
        platform = escape_latex(cert.platform)
        
        if instructor:
            org_line = f"Instructor: {instructor} \\hspace{{48pt}}Platform: {platform}"
        else:
            org_line = f"Platform: {platform}"
        
        # Build link if available
        link_text = ""
        if cert.certification_link:
            link_text = f"\\href{{{cert.certification_link}}}{{Certification Link}}"
        else:
            link_text = "{}"
        
        lines.append("\\resumeSubHeadingListStart")
        lines.append(f"    \\resumeSubheading{{{title}}}")
        lines.append(f"    {{{date_range}}}{{{org_line}}}")
        lines.append(f"    {{{link_text}}}")
        lines.append("\\resumeSubHeadingListEnd")
    
    lines.append("\\vspace{-1pt}")
    
    return "\n".join(lines)


def generate_awards_section(awards: List[AwardResponse]) -> str:
    """Generate LaTeX awards section"""
    if not awards:
        return ""
    
    lines = []
    lines.append("%-----------AWARDS-----------------")
    lines.append("\\section{Honors and Awards}")
    lines.append("\\begin{description}[font=$\\bullet$]")
    
    for award in awards:
        title = escape_latex(award.title)
        date = escape_latex(award.date)
        lines.append(f"\\item {{{title} \\hfill \\raggedleft {date}}}")
        lines.append("\\vspace{-5pt}")
    
    lines.append("\\end{description}")
    
    return "\n".join(lines)


def generate_volunteer_section(volunteers: List[VolunteerResponse]) -> str:
    """Generate LaTeX volunteer experience section"""
    if not volunteers:
        return ""
    
    lines = []
    lines.append("%-----------VOLUNTEER EXPERIENCE-----------------")
    lines.append("\\vspace{-5pt}")
    lines.append("\\section{Volunteer Experience}")
    lines.append("  \\resumeSubHeadingListStart")
    
    for volunteer in volunteers:
        position = escape_latex(volunteer.position)
        organization = escape_latex(volunteer.organization)
        location = escape_latex(volunteer.location)
        description = escape_latex(volunteer.description)
        date_range = format_date_range(volunteer.start_date, volunteer.end_date)
        
        # Format: position, organization (comma separated)
        position_org = f"{position}, {organization}"
        
        lines.append("\t\\resumeSubheading")
        lines.append(f"    {{{position_org}}}{{{location}}}")
        lines.append(f"    {{{description}}}{{{date_range}}}")
        
        if volunteer != volunteers[-1]:  # Add spacing except for last item
            lines.append("\\vspace{5pt}")
    
    lines.append("\\resumeSubHeadingListEnd")
    
    return "\n".join(lines)


def generate_latex_from_resume(resume_data: CustomResumeResponse, user_data: UserResponse) -> str:
    """
    Generate LaTeX document from resume data and user data.
    
    Args:
        resume_data: CustomResumeResponse with all populated sections
        user_data: UserResponse with user information
    
    Returns:
        Complete LaTeX document as string
    """
    # Read the base template
    # __file__ is at /app/app/services/latex_generation_service.py
    # We need to go up 2 levels to /app/app, then into templates
    template_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "templates",
        "resume_template.tex"
    )
    
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()
    
    # Find the document start and end
    doc_start = template.find("\\begin{document}")
    doc_end = template.find("\\end{document}")
    
    if doc_start == -1 or doc_end == -1:
        raise ValueError("Template does not contain \\begin{document} or \\end{document}")
    
    # Extract header (everything before \begin{document})
    header = template[:doc_start]
    
    # Find the end of \begin{document} line (including newline)
    doc_start_end = template.find("\n", doc_start)
    if doc_start_end == -1:
        # If no newline found, use the end of the string
        doc_start_end = doc_start + len("\\begin{document}")
    else:
        doc_start_end += 1  # Include the newline
    
    # Generate sections
    sections = []
    
    # Heading section (always present)
    heading_section = generate_heading_section(resume_data.headings, user_data)
    sections.append(heading_section)
    
    # Education section
    if resume_data.educations:
        sections.append(generate_education_section(resume_data.educations))
    
    # Experience section
    if resume_data.experiences:
        sections.append(generate_experience_section(resume_data.experiences))
    
    # Projects section
    if resume_data.projects:
        sections.append(generate_projects_section(resume_data.projects))
    
    # Skills section
    if resume_data.skills:
        sections.append(generate_skills_section(resume_data.skills))
    
    # Certifications section
    if resume_data.certifications:
        sections.append(generate_certifications_section(resume_data.certifications))
    
    # Awards section
    if resume_data.awards:
        sections.append(generate_awards_section(resume_data.awards))
    
    # Volunteer section
    if resume_data.volunteers:
        sections.append(generate_volunteer_section(resume_data.volunteers))
    
    # Combine header, \begin{document}, sections, and \end{document}
    body = "\n\n".join(sections)
    latex_doc = header + template[doc_start:doc_start_end] + "\n\n" + body + "\n\n\\end{document}"
    
    return latex_doc
