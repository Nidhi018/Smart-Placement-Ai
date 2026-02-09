from flask import Flask, request, jsonify
from resume_analyzer import analyze_resume_with_gemini
from train_model import predict_placement_probability, train_custom_model
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Smart Placement AI Service is running"})

@app.route('/health')
def health():
    return jsonify({"status": "OK"})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    resume_text = data.get('resume_text', '')
    
    # 1. Get Custom Model Prediction (Database Similarity)
    dataset_score = predict_placement_probability(resume_text)
    
    # 2. Get Gemini Insights (Hybrid Analysis)
    # We pass the dataset_score so Gemini can weigh it against content quality.
    insights = analyze_resume_with_gemini(resume_text, custom_model_score=dataset_score)
    
    # 3. Extract final hybrid score
    # Gemini will synthesis the database score + content quality into a final percentage.
    final_score = insights.get("match_percentage", 0)
    
    result = {
        "placement_probability": final_score,
        "database_similarity": dataset_score, # Optional: Send both if valid
        "ai_analysis": insights
    }
    
    return jsonify(result)

@app.route('/train', methods=['POST'])
def trigger_training():
    # Admin endpoint to re-train the model
    result = train_custom_model()
    return jsonify(result)

if __name__ == '__main__':
    # Initial training check
    if not os.path.exists('placement_model.pkl'):
        print("Model not found, training initial model...")
        train_custom_model()
        
    app.run(debug=True, host='0.0.0.0', port=5000)
