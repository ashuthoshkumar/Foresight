# Foresight — AI "What If" Decision Engine

An AI-powered platform that simulates the multi-faceted consequences of hypothetical scenarios, providing predictive insights across financial, environmental, human, risk, and opportunity dimensions.

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your Gemini API key
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** FastAPI + Python 3.11+
- **AI:** Google Gemini API + NetworkX Knowledge Graph
- **MVP Domain:** Hyderabad EV/Traffic Policy

## License
MIT
