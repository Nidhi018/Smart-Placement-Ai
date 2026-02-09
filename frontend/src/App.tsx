import './App.css'
import Dashboard from './components/Dashboard'
import History, { type HistoryItem } from './components/History'
import Login from './components/Login'
import { useState, useEffect } from 'react'

interface AnalysisResult {
  placement_probability: number;
  // Add candidate name (optional, as old records might not have it in this structure, strictly speaking it's in the DB model)
  // But for the detail view, we pass it along.
  candidate_name?: string;
  file_path?: string; // Add file path
  ai_analysis: {
    error?: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    missing_keywords: string[];
    recommended_roles: { role: string; match: number }[];
    content_rating?: number;
    verdict: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  picture: string;
  sub: string; // Google ID
  token: string; // Raw JWT
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  // Restore session from localStorage on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user_profile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userInfo: any) => {
    setUser(userInfo);
    localStorage.setItem('user_profile', JSON.stringify(userInfo));
    // Store token globally or context for axios interceptors (simple approach: pass to components or assume components read from storage/state)
    localStorage.setItem('auth_token', userInfo.token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_profile');
    localStorage.removeItem('auth_token');
    setView('dashboard');
    setSelectedAnalysis(null);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // Map HistoryItem to AnalysisResult
    // Note: ai_analysis_data in DB stores the FULL JSON response, which includes "ai_analysis" key.
    const innerAnalysis = item.ai_analysis_data?.ai_analysis || item.ai_analysis_data;

    const mappedResult: AnalysisResult = {
      placement_probability: item.placement_probability,
      candidate_name: item.candidate_name, // Pass the name
      file_path: item.file_path || (item as any).file_path, // Ensure we catch it from history item
      ai_analysis: innerAnalysis
    };

    setSelectedAnalysis(mappedResult);
    setView('dashboard');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div
          className="logo"
          onClick={() => { setView('dashboard'); setSelectedAnalysis(null); }}
          style={{ cursor: 'pointer' }}
        >
          _Smart_Placement::AI
        </div>

        {/* Central Resume Name Display */}
        {view === 'dashboard' && selectedAnalysis?.candidate_name && (
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9rem',
            color: 'var(--text-main)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.4rem 1rem',
            borderRadius: '50px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ opacity: 0.5 }}>📄</span>
            {selectedAnalysis.file_path ? (
              <a
                href={`http://localhost:8082${selectedAnalysis.file_path}?token=${user.token}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                title="Open Resume PDF"
              >
                {selectedAnalysis.candidate_name} ↗
              </a>
            ) : (
              <span>{selectedAnalysis.candidate_name}</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setView('dashboard'); setSelectedAnalysis(null); }}
            >
              /dashboard
            </button>
            <button
              className={`nav-btn ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              /history
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
            <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main>
        {view === 'dashboard' ? (
          <Dashboard
            initialResult={selectedAnalysis}
            onAnalysisComplete={(res) => setSelectedAnalysis(res)}
          />
        ) : (
          <History onSelect={handleHistorySelect} />
        )}
      </main>
    </div>
  )
}

export default App
