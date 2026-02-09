import React, { useState } from 'react';
import axios from 'axios';

interface AnalysisResult {
    placement_probability: number;
    ai_analysis: {
        error?: string;
        summary: string;
        strengths: string[];
        weaknesses: string[];
        missing_keywords: string[];
        recommended_roles: { role: string; match: number }[];
        content_rating?: number;
        verdict: string;
        score_breakdown?: {
            skills_match: number;
            project_quality: number;
            ats_compatibility: number;
            formatting: number;
        };
        learning_roadmap?: {
            timeline: string;
            focus: string;
            skills: string[];
            action_items: string[];
        }[];
        resume_improvements?: {
            original_text: string;
            suggested_rewrite: string;
            reason: string;
        }[];
        candidate_name?: string;
    };
}

interface DashboardProps {
    initialResult?: AnalysisResult | null;
    onAnalysisComplete?: (result: AnalysisResult) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ initialResult, onAnalysisComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(initialResult || null);
    const [error, setError] = useState<string>('');

    // Update result when initialResult changes (from history navigation)
    React.useEffect(() => {
        if (initialResult) {
            setResult(initialResult);
            // Clear current file input since we are viewing history
            setFile(null);
        }
    }, [initialResult]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.post('http://localhost:8082/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            // The backend now returns "data" which is the AnalysisResult map from AI Service.
            // It includes "candidate_name" at the top level because we modified AI Service to return it.
            const responseData = response.data.data;
            setResult(responseData);

            if (onAnalysisComplete) {
                // Check if candidate_name is nested inside ai_analysis (which it is from AI Service)
                const name = responseData.candidate_name || responseData.ai_analysis?.candidate_name;

                onAnalysisComplete({
                    ...responseData,
                    candidate_name: name,
                    file_path: `/uploads/${file.name}` // Construct path immediately for current session
                });
            }
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.error || 'Failed to analyze resume. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Determine color based on score
    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981'; // Success Green
        if (score >= 50) return '#f59e0b'; // Warning Yellow
        return '#ef4444'; // Error Red
    };

    return (
        <div className={`dashboard-container ${result ? 'results-mode' : ''}`}>

            {/* Sidebar / Upload Section (Collapsed when result exists) */}
            <div className={`upload-section ${result ? 'collapsed' : ''}`}>
                <div className="card h-full">
                    {!result ? (
                        <>
                            <h2><span style={{ opacity: 0.5 }}>01.</span> Upload Resume</h2>
                            <div className="upload-area" onClick={() => document.getElementById('fileInput')?.click()}>
                                <div className="upload-icon">
                                    {file ? '📄' : '☁️'}
                                </div>
                                <p className="upload-text">
                                    {file ? file.name : "Drop your PDF here"}
                                </p>
                                <p className="upload-subtext">
                                    Supported Format: PDF (Max 5MB)
                                </p>
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <button
                                className="btn-primary"
                                onClick={handleUpload}
                                disabled={!file || loading}
                            >
                                {loading ? (
                                    <><span className="spinner">⚡</span> Analyzing...</>
                                ) : (
                                    "Run Analysis System"
                                )}
                            </button>
                            {error && (
                                <div className="error-box">⚠️ {error}</div>
                            )}
                        </>
                    ) : (
                        <div className="collapsed-upload" onClick={() => { setResult(null); setFile(null); }}>
                            <div className="collapsed-icon" title="Upload New Resume">📄</div>
                            <span className="collapsed-text">New Upload</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {result && (
                <div className="results-grid">
                    {/* Left Column: Analytics Key Insights */}
                    <div className="card results-card" style={{}}>
                        <h2><span style={{ opacity: 0.5 }}>02.</span> KEY INSIGHTS</h2>

                        <div className="score-container compact">
                            <div className="score-circle small" style={{
                                '--progress': `${result.placement_probability || 0}%`,
                                '--score-color': getScoreColor(result.placement_probability || 0)
                            } as any}>
                                <div className="score-inner small">
                                    <span className="score-value small">{result.placement_probability?.toFixed(0) || 0}%</span>
                                    <span className="score-label">MATCH</span>
                                </div>
                            </div>

                            <div className="content-rating-box">
                                <div className="cr-label">Content Quality</div>
                                <div className="cr-val">{result.ai_analysis.content_rating || 0}/100</div>
                                <div className="cr-bar-bg">
                                    <div className="cr-bar-fill" style={{ width: `${result.ai_analysis.content_rating || 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Explainable Score Breakdown */}
                        {result.ai_analysis.score_breakdown && (
                            <div className="score-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {Object.entries(result.ai_analysis.score_breakdown).map(([key, value]) => (
                                    <div key={key} className="mini-score-box">
                                        <div className="mini-label">{key.replace('_', ' ')}</div>
                                        <div className="mini-val" style={{ color: getScoreColor(value as number) }}>{value}%</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="verdict compact" style={{
                            borderColor: getScoreColor(result.placement_probability || 0),
                            color: getScoreColor(result.placement_probability || 0),
                            background: `rgba(${result.placement_probability >= 80 ? '16, 185, 129' : '245, 158, 11'}, 0.05)`
                        }}>
                            {result.ai_analysis.verdict || "N/A"}
                        </div>

                        <h3>Strengths</h3>
                        <div className="tag-container">
                            {result.ai_analysis.strengths?.map((s, i) => (
                                <span key={i} className="tag success">✓ {s}</span>
                            ))}
                        </div>

                        {/* Areas for Improvement (Weaknesses) */}
                        {result.ai_analysis.weaknesses && result.ai_analysis.weaknesses.length > 0 && (
                            <>
                                <h3>Areas for Improvement</h3>
                                <div className="tag-container">
                                    {result.ai_analysis.weaknesses.map((w, i) => (
                                        <span key={i} className="tag warning">⚠ {w}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Detailed Roadmap & Rewrites */}
                    <div className="card results-card scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>


                        {/* Recommended Roles - NOW TOP PRIORITY (03) */}
                        <div>
                            <h2><span style={{ opacity: 0.5 }}>03.</span> Recommended Roles</h2>
                            <div className="roles-grid-large">
                                {result.ai_analysis.recommended_roles?.map((roleItem, i) => (
                                    <div key={i} className="role-box large" style={{ '--match': `${roleItem.match}%` } as any}>
                                        <div className="role-header">
                                            <span className="role-name">{roleItem.role}</span>
                                            <span className="role-percent">{roleItem.match}%</span>
                                        </div>
                                        <div className="role-bar-bg">
                                            <div className="role-bar-fill" style={{ width: `${roleItem.match}%` }}></div>
                                        </div>
                                    </div>
                                )) || <p className="text-muted">No roles recommended.</p>}
                            </div>
                        </div>

                        {/* Learning Roadmap (04) */}
                        {result.ai_analysis.learning_roadmap && (
                            <div>
                                <h2><span style={{ opacity: 0.5 }}>04.</span> 🚀 Career Roadmap</h2>
                                <div className="timeline-container">
                                    {result.ai_analysis.learning_roadmap.map((step: any, i: number) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-marker"></div>
                                            <div className="timeline-content">
                                                <div className="timeline-header">
                                                    <span className="timeline-time">{step.timeline}</span>
                                                    <span className="timeline-focus">{step.focus}</span>
                                                </div>
                                                <div className="timeline-skills">
                                                    {step.skills?.map((skill: string, j: number) => (
                                                        <span key={j} className="skill-badge">{skill}</span>
                                                    ))}
                                                </div>
                                                <ul className="timeline-actions">
                                                    {step.action_items?.map((action: string, k: number) => (
                                                        <li key={k}>• {action}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resume Rewrites (05) */}
                        {result.ai_analysis.resume_improvements && (
                            <div>
                                <h2><span style={{ opacity: 0.5 }}>05.</span> ✍️ Resume Rewrites</h2>
                                <div className="rewrites-container">
                                    {result.ai_analysis.resume_improvements.map((item: any, i: number) => (
                                        <div key={i} className="rewrite-box">
                                            <div className="rewrite-original">
                                                <div className="rewrite-label">Original</div>
                                                <p>"{item.original_text}"</p>
                                            </div>
                                            <div className="rewrite-arrow">➜</div>
                                            <div className="rewrite-suggestion">
                                                <div className="rewrite-label success">Better</div>
                                                <p>"{item.suggested_rewrite}"</p>
                                                <div className="rewrite-reason">💡 {item.reason}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
