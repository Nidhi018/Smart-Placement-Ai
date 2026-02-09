import os
import pickle
import glob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2

# Define paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'resume_dataset', 'tech-resume')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'placement_model.pkl')

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

def train_custom_model():
    """
    Ingests all PDFs in data/tech_resumes, vectorizes them, and saves the 
    TF-IDF vectorizer and the 'Gold Standard' feature matrix.
    """
    print("Looking for Tech Resumes in:", DATA_DIR)
    
    pdf_files = glob.glob(os.path.join(DATA_DIR, "*.pdf"))
    
    if not pdf_files:
        print("No PDF resumes found in data/tech_resumes. Using dummy data for initialization.")
        # Fallback dummy data if folder is empty
        documents = [
            "Software Engineer Java Python SQL Docker Kubernetes",
            "Full Stack Developer React Node.js TypeScript MongoDB",
            "DevOps Engineer CI/CD Jenkins AWS Terraform Linux"
        ]
    else:
        documents = []
        print(f"Found {len(pdf_files)} resumes. Extracting text...")
        for pdf_file in pdf_files:
            text = extract_text_from_pdf(pdf_file)
            if len(text.strip()) > 50: # Filter empty files
                documents.append(text)
        
        print(f"Successfully processed {len(documents)} resumes.")

    if not documents:
         return {"error": "No valid text found in resumes."}

    # 1. Create and Fit TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(stop_words='english', max_features=2000)
    tfidf_matrix = vectorizer.fit_transform(documents)

    # 2. Save the Vectorizer and the Matrix (The "Knowledge Base")
    model_data = {
        "vectorizer": vectorizer,
        "matrix": tfidf_matrix,
        "doc_count": len(documents)
    }

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model_data, f)
        
    print(f"Tech Similarity Model saved using {len(documents)} documents.")
    return {"status": "success", "doc_count": len(documents)}

def predict_placement_probability(resume_text):
    """
    Calculates the similarity of the new resume against the 'Gold Standard' resumes.
    Returns a score 0-100.
    """
    if not os.path.exists(MODEL_PATH):
        return 0.0

    try:
        with open(MODEL_PATH, 'rb') as f:
            model_data = pickle.load(f)
            
        vectorizer = model_data["vectorizer"]
        gold_standard_matrix = model_data["matrix"]
        
        # Vectorize the new resume
        new_vec = vectorizer.transform([resume_text])
        
        # Calculate similarity against ALL gold standard resumes
        similarities = cosine_similarity(new_vec, gold_standard_matrix)
        
        # Strategy: Valid candidates should match at least ONE or the AVERAGE of the gold standards.
        # Let's take the Top 3 matches and average them (or max if only 1 doc).
        # This represents "How close is this to our best resumes?"
        
        if len(similarities[0]) == 0:
            return 0.0
            
        # Get max similarity (Best Match)
        best_match_score = similarities.max()
        
        # Scale it: Cosine sim is 0-1. 
        # A score of 1.0 means identical. A score of 0.3-0.5 is usually very good for text.
        # Let's normalize so 0.6 => 100% chance (heuristic).
        
        normalized_score = min(best_match_score * 200, 98) # simple heuristic scaling
        normalized_score = max(normalized_score, 10)       # min score
        
        return float(normalized_score)
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return 0.0

if __name__ == "__main__":
    train_custom_model()
