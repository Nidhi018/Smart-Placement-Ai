# Contributing to Smart Placement AI 🤝

Thank you for your interest in contributing to Smart Placement AI! This document provides guidelines and instructions for contributing.

---

## 🚀 Quick Start for Contributors

### 1. Fork & Clone
```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/Nidhi018/Smart-Placement-Ai
cd Smart-Placement-Ai
```

### 2. Development Setup
```bash
# Copy environment file
cp .env.example .env

# Add your GEMINI_API_KEY to .env

# Run in development mode (builds locally + hot reload)
docker compose -f docker-compose.dev.yml up --build
```

### 3. Make Changes
- Frontend: Changes auto-reload (Vite HMR)
- Backend: Restart backend service after Go changes
- AI Service: Python changes may require restart

### 4. Test Your Changes
```bash
# Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:8082
# MinIO Console: http://localhost:9001
```

### 5. Submit PR
```bash
git checkout -b feature/your-feature-name
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub!

---

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Check existing issues first
- Provide clear reproduction steps
- Include environment details (OS, Docker version, etc.)
- Add error messages and logs

### ✨ Feature Requests
- Describe the problem you're solving
- Explain your proposed solution
- Consider backward compatibility

### 💻 Code Contributions
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed
- Test your changes thoroughly

### 📚 Documentation
- Fix typos and improve clarity
- Add examples and use cases
- Translate to other languages
- Create tutorials and guides

---

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature X
fix: resolve bug in Y
docs: update README
style: format code
refactor: restructure Z
test: add tests for W
chore: update dependencies
```

---

## 🧪 Testing Checklist

Before submitting a PR, ensure:

- [ ] Code builds without errors
- [ ] All services start successfully
- [ ] Upload & analysis flow works end-to-end
- [ ] Google sign-in works
- [ ] History loads correctly
- [ ] PDFs display properly
- [ ] No console errors in browser
- [ ] No errors in backend/AI service logs

---

## 🏗️ Architecture Overview

### Frontend (React + TypeScript + Vite)
- `src/components/` - React components (Login, Dashboard, History)
- `src/App.tsx` - Main app with routing
- `src/main.tsx` - Entry point with Google OAuth provider

### Backend (Go + Gin)
- `handlers/` - API endpoint handlers (upload, history)
- `middleware/` - Auth middleware (Google token verification)
- `models/` - Database models (GORM)
- `database/` - DB & Redis connection logic
- `main.go` - Server entrypoint

### AI Service (Python + Flask)
- `app.py` - Flask API server
- `resume_analyzer.py` - Gemini integration
- `train_model.py` - TF-IDF similarity model
- `download_data.py` - Kaggle dataset downloader

---

## 🐳 Working with Docker

### Development Mode
```bash
# Build and run with local changes
docker compose -f docker-compose.dev.yml up --build

# View logs
docker compose -f docker-compose.dev.yml logs -f [service_name]

# Restart a service
docker compose -f docker-compose.dev.yml restart backend

# Rebuild specific service
docker compose -f docker-compose.dev.yml build ai-service
```

### Production Mode
```bash
# Uses pre-built images from ghcr.io
docker compose up -d
```

---

## 🔐 Environment Variables

### Required
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://ai.google.dev/)

### Database
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

### Storage
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`

### Cache
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional)

---

## 📦 Building Docker Images

For maintainers publishing new releases:

```bash
# Linux/Mac
./build-and-push.sh v1.0.1

# Windows PowerShell
.\build-and-push.ps1 v1.0.1
```

**Prerequisites:**
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

---

## 🎨 Code Style

### Frontend (TypeScript/React)
- Use functional components with hooks
- TypeScript for type safety
- ESLint for linting

### Backend (Go)
- Follow Go conventions (gofmt)
- Use meaningful variable names
- Add error handling

### AI Service (Python)
- PEP 8 style guide
- Type hints where applicable
- Docstrings for functions

---

## 🤔 Questions?

- Open a [Discussion](https://github.com/Nidhi018/Smart-Placement-Ai/discussions)
- File an [Issue](https://github.com/Nidhi018/Smart-Placement-Ai/issues)
- Check existing documentation

---

## 📜 Code of Conduct

Be respectful, inclusive, and professional. We're all here to learn and build something great together!

---

**Thank you for contributing! 🎉**
