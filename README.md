# Smart Placement AI ⚡

Smart Placement AI is a self-hosted resume analyzer that combines:
✅ a lightweight similarity model + 🤖 Gemini insights, with 🔐 Google sign-in and 📜 per-user history.

## Highlights ✨

- 🧠 Resume analysis (strengths, weaknesses, ATS notes, rewrite suggestions)
- 📈 Match score (0–100) and recommended roles
- 🔐 Google ID-token auth (verified + cached in Redis)
- 🗄️ PDFs stored in MinIO + viewable from the UI
- 🐘 Results stored in Postgres + `/history` per account

## How It Works (1-minute mental model) 🧩

1) Frontend gets a Google **ID token**
2) Backend verifies token (Google `tokeninfo`) and caches it in **Redis**
3) Upload → backend extracts text, stores the PDF in **MinIO**, calls the **AI service**
4) Backend stores the result in **Postgres** and shows it in **History**

## Architecture 🗺️

```mermaid
flowchart LR
    U[👤 User] --> F[🖥️ Frontend<br/>React + Vite]
    
    F -->|1. Google Sign-In| G[🔐 Google OAuth]
    G -->|ID Token| F
    
    F -->|2. Upload PDF + Token| B[🧠 Backend<br/>Go + Gin]
    
    B -->|3. Extract Text| B
    B -->|4. Store PDF| M[(🗄️ MinIO)]
    B -->|5. Verify Token| R[(⚡ Redis)]
    
    B -->|6. Analyze Text| A[🤖 AI Service<br/>Python]
    A -->|Call Gemini| AI[✨ Gemini API]
    AI -->|Insights| A
    
    A -->|7. Results| B
    B -->|8. Save Results| DB[(🐘 Postgres)]
    
    B -->|9. Response| F
    F -->|10. Display| U
    
    style F fill:#6366f1,stroke:#4f46e5,stroke-width:3px,color:#fff
    style B fill:#8b5cf6,stroke:#7c3aed,stroke-width:3px,color:#fff
    style A fill:#ec4899,stroke:#db2777,stroke-width:3px,color:#fff
    style G fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:#fff
    style AI fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:#fff
    style DB fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    style R fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    style M fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    style U fill:#64748b,stroke:#475569,stroke-width:3px,color:#fff
```

## Run (Docker) 🐳

Create `.env` from `.env.example`, then:

```bash
docker compose up -d --build
```

## Configuration 🔧

Minimum required:

- 🔑 `GEMINI_API_KEY` (AI service)
- 🐘 `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- 🗄️ `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
- ⚡ `REDIS_HOST`, `REDIS_PORT` (password optional)

Google OAuth note:

- The frontend currently has a **hard-coded Google OAuth Client ID** in `frontend/src/main.tsx`.
  For a real open-source setup, replace it with your own Client ID.

## Endpoints (what you’ll actually hit) 🧪

- `POST /upload` (PDF multipart form) — 🔒 requires `Authorization: Bearer <google_id_token>`
- `GET /history` — 🔒 requires auth
- `GET /uploads/:filename` — 🔒 requires auth (also supports `?token=<id_token>` for inline viewing)

## Notes 📌

- PDF text extraction uses `pdftotext` (Poppler). The backend container installs it.
- The AI service can bootstrap a basic similarity model even without the dataset.
- Want to retrain similarity scoring? The AI service exposes `POST /train` (treat as admin-only).

## License 📄

No license file is included yet. If you’re planning to publish this as OSS, add a `LICENSE` (e.g., MIT/Apache-2.0) to clarify usage rights.
