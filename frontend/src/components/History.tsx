import React, { useEffect, useState } from 'react';
import axios from 'axios';

export interface HistoryItem {
    id: number;
    candidate_name: string;
    profession: string;
    placement_probability: number;
    created_at: string;
    verdict: string;
    content_rating: number;
    ai_analysis_data: any; // Full JSON data
    file_path?: string;
}

interface HistoryProps {
    onSelect: (item: HistoryItem) => void;
}

const History: React.FC<HistoryProps> = ({ onSelect }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await axios.get('http://localhost:8082/history', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setHistory(response.data.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="card" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <h2><span style={{ opacity: 0.5 }}>03.</span> Analysis History</h2>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading records...
                </div>
            ) : history.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}>📂</div>
                    No analysis history found.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="history-item"
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                    {item.candidate_name || "Unknown Candidate"}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', gap: '1rem' }}>
                                    <span style={{ fontFamily: 'JetBrains Mono' }}>{item.profession}</span>
                                    <span>•</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CONTENT</div>
                                    <div style={{ fontWeight: '700' }}>{item.content_rating}/100</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        color: getScoreColor(item.placement_probability),
                                        fontWeight: '800',
                                        fontSize: '1.5rem',
                                        textShadow: `0 0 10px ${getScoreColor(item.placement_probability)}40`
                                    }}>
                                        {item.placement_probability}%
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: getScoreColor(item.placement_probability),
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {item.verdict}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
