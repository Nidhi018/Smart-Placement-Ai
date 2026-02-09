import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def analyze_resume_with_gemini(resume_text, custom_model_score=None):
    """
    Analyzes the resume text using Gemini 1.5 Flash, incorporating insights
    from the custom local model if available.
    """
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not found in environment variables"}

    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are an expert Career Counselor and Resume Analyst.
    
    1. First, identify the **primary profession/role** of this candidate based on the resume (e.g., "Software Engineer", "Corporate Lawyer", "Nurse").
    2. Then, analyze the resume **specifically according to the standards and expectations of that profession**. Do not compare a Lawyer to Tech standards, etc.
    
    3. Finally, assign a **Match Percentage (0-100)** based on:
        - **Data Quality**: Is the resume detailed and quantifiable?
        - **Role Fit**: Does the candidate have the necessary skills for their identified profession?
        - **Completeness**: Are there missing sections or vague descriptions?
    
    Here is the content of the candidate's resume:
    ---
    {resume_text}
    ---
    
    """
    
    if custom_model_score is not None:
        prompt += f"""
        **Internal Database Context**:
        Our Dataset Similarity Model (trained on successful hires) scored this resume: **{custom_model_score:.2f}%**.
        
        **Instructions for Final Score**:
        - Consider this Similarity Score as a strong signal of fit.
        - However, if the content quality is poor despite high similarity, lower the score.
        - If the content is excellent but similarity is low (e.g., different terminology), boost the score.
        - Your final 'match_percentage' should be a weighted synthesis of both.
        """
    
    prompt += """
    Please provide a structured JSON response with the following fields:
    1. "candidate_name": The full name of the candidate extracted from the resume header. If not found, use "Unknown Candidate".
    2. "summary": A brief professional summary, mentioning the identified profession.
    3. "strengths": A list of 3-5 strengths relevant to their specific profession.
    4. "weaknesses": A list of 3-5 areas for improvement (specific to their field).
    5. "missing_keywords": Important industry-standard keywords missing from the resume.
    6. "recommended_roles": List of objects with "role" (string) and "match" (integer 0-100). Example: [{"role": "DevOps Engineer", "match": 85}, ...]
    7. "verdict": A final verdict (Highly Recommended, Recommended, Needs Improvement).
    8. "match_percentage": An integer score (0-100) representing the overall Role Fit & Hybrid Score.
    9. "content_rating": An integer score (0-100) rating ONLY the quality of the resume writing, formatting, and impact.
    10. "score_breakdown": {
        "skills_match": (0-100),
        "project_quality": (0-100),
        "ats_compatibility": (0-100),
        "formatting": (0-100)
    }
    11. "resume_improvements": List of objects:
        [
            {"original_text": "Worked on Java", "suggested_rewrite": "Developed scalable microservices using Java Spring Boot...", "reason": "More impact and keywords."},
            ... (3-4 suggestions)
        ]
    12. "learning_roadmap": [
        {"timeline": "0-30 days", "focus": "...", "skills": ["Skill A", "Skill B"], "action_items": ["Build X", "Learn Y"]},
        {"timeline": "30-60 days", "focus": "...", "skills": ["Skill C", "Skill D"], "action_items": ["Deploy Z", "Contribute to Open Source"]},
        {"timeline": "60-90 days", "focus": "...", "skills": ["Skill E", "Skill F"], "action_items": ["Apply to senior roles", "Mock Interview"]}
    ]
    13. "ats_audit": {
        "passed": boolean,
        "issues": ["List of specific formatting or parsing issues found"]
    }

    Return ONLY raw JSON, no markdown formatting.
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text_response)
    except Exception as e:
        return {"error": str(e), "raw_response": response.text if 'response' in locals() else "N/A"}
