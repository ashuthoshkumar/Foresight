# 🔮 Foresight AI (MVP)

> **Explore the Future Before It Happens**  
> Foresight is an MVP (Minimum Viable Product) for an advanced "What If" simulation platform powered by Google Gemini. It allows policymakers, researchers, and citizens to simulate the multi-dimensional impact of policy changes or structural shifts in a rapidly iterating environment.

## 🚀 MVP Scope & Features

This repository represents the initial Minimum Viable Product. It is designed to prove the core concept of AI-driven policy simulation, integrating live AI inference with interactive visualizations and a functional monetization flow.

### Core MVP Features
- **🎯 Scenario Simulation Engine**: Core "What If" logic powered by Google Gemini (`gemini-2.5-flash`) mapping user scenarios to multi-dimensional impact scores.
- **💳 Live Monetization (Stripe)**: End-to-end integration with Stripe Checkout to gate premium features (Pro Tier).
- **📸 Future Vision Camera (Demo)**: AI-generated images of simulated policy changes using Pollinations AI.
- **🗺️ Interactive Dashboards**: Visualizing impact via Recharts (Radar/Line charts) and React-Leaflet maps.
- **⚔️ Battle Mode & Goal-Seeker**: Initial implementations of comparative analysis and backcasting.
- **🌍 Localization**: Base infrastructure for English, Hindi, and Telugu support.

## 🏗️ MVP Tech Stack

### Frontend (Vercel)
- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS (Glassmorphism design system for fast iteration)
- **Visualizations**: Recharts, React-Leaflet, React-Force-Graph-2D

### Backend (Render)
- **Framework**: FastAPI (Python)
- **AI/LLM**: Google Gemini via `google-genai` SDK
- **Billing**: Stripe Checkout & Webhooks
- **Database**: Ephemeral SQLite / JSON for rapid MVP iteration (to be migrated to PostgreSQL in V2)

## 🛠️ Running the MVP Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Google Gemini API Key
- Stripe Test Secret Key

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Create .env based on the template
cp .env.template .env
# Fill in GEMINI_API_KEY and STRIPE_SECRET_KEY in .env

python -m uvicorn app.main:app --reload
```
*API runs on `http://localhost:8000`*

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start the Vite dev server
npm run dev
```
*App runs on `http://localhost:5173`*

## 🛣️ Post-MVP Roadmap
- **Database Migration**: Move from SQLite/JSON to a managed PostgreSQL database (e.g., Supabase/Neon).
- **Authentication**: Implement robust JWT/OAuth authentication instead of local storage tokens.
- **Real-time Data Hooks**: Connect to live city APIs (Traffic, AQI) for grounded simulations.

---
*Built with ❤️ for a smarter, data-driven future.*
