# 🔮 Foresight AI (MVP)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-blue?style=for-the-badge&logo=vercel)](https://foresight-ten-kappa.vercel.app/)

> **Explore the Future Before It Happens**  
> Foresight is an AI-powered "What If" simulation platform that helps users analyze the potential impact of policy changes and strategic decisions. Powered by Google Gemini, it delivers predictive insights, interactive visualizations, and scenario comparisons to support smarter, data-driven decision-making.

## 💼 Business Model (Freemium)

The Foresight MVP validates a scalable SaaS business model using Stripe for billing. It operates on a freemium model designed to drive initial adoption while monetizing advanced features:

- **Free Tier (Citizen/Guest)**: Gives users a taste of the simulation engine with strict daily scenario limits. Limits expensive API calls to Gemini and Pollinations AI while providing baseline value.
- **Pro Tier (Policymaker/Enterprise)**: A $15/month subscription unlocking advanced analytics:
  - ⚡ Unlimited Scenario Simulations
  - 🎯 Goal-Seeker & Backcasting Tools
  - ⚔️ Scenario Battle Mode (A/B testing policies)
  - 📊 PDF Export & Executive Report Cards
  - 🏙️ Unrestricted Access to all Regional City Models

## 🚀 MVP Scope & Features

This repository represents the initial Minimum Viable Product. It is designed to prove the core concept of AI-driven policy simulation, integrating live AI inference with interactive visualizations and a functional monetization flow.

### Core MVP Features
- **🎯 Scenario Simulation Engine**: Leverages Google Gemini 2.5 Flash to evaluate "What If" policy and decision scenarios, generating multi-dimensional impact analysis across economic, social, environmental, and governance metrics.
- **💳 Live Monetization (Stripe)**: Seamless Stripe Checkout integration enabling secure subscriptions and feature gating for the Pro tier with a production-ready payment flow.
- **📸 Future Vision Camera (Demo)**: Generates AI-powered visualizations of simulated policy outcomes using Pollinations AI, helping users intuitively understand potential future scenarios.
- **🗺️ Interactive Dashboards**: Rich, real-time data visualizations built with Recharts and React Leaflet, featuring radar charts, trend analysis, and geographic impact mapping.
- **⚔️ Battle Mode & Goal-Seeker**: Compare multiple scenarios side-by-side and leverage AI-driven backcasting to identify the optimal path toward desired policy or development goals.
- **🌍 Localization**: Built-in localization framework supporting English, Hindi, and Telugu, making the platform accessible to a broader audience.

## ✨ Key Highlights

- 🤖 AI-driven scenario prediction using Google Gemini
- 📊 Interactive data visualization with Recharts
- 🌍 Multi-language support (English, Hindi & Telugu)
- 💳 Secure Stripe-based subscription management
- 📍 Regional policy comparison with interactive maps
- ⚡ Fast frontend built using React + Vite
- 🔒 Scalable backend powered by FastAPIs

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
