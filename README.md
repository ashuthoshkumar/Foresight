# 🔮 Foresight AI Decision Engine

![Foresight Banner](https://via.placeholder.com/1200x400/050505/ffffff?text=Foresight+AI+Decision+Engine)

> **Explore the Future Before It Happens**  
> Foresight is an advanced "What If" simulation platform powered by Google Gemini and real-time public datasets. It allows policymakers, researchers, and citizens to simulate the multi-dimensional impact of policy changes or structural shifts.

## ✨ Features

Foresight goes far beyond basic LLM chatbots by integrating verifiable data, interactive visualizations, and deep multi-dimensional analysis.

- **🌐 Multi-Dimensional Impact Analysis**: Simulates impact across 5 critical axes: Financial, Environmental, Human, Risk, and Opportunity.
- **⚔️ Scenario Battle Mode**: Pit two competing scenarios against each other (e.g. "Ban Petrol Cars" vs. "Make Public Transport Free") to see which wins across different metrics.
- **🗺️ Live City Impact Map**: An interactive, animated map (built with Leaflet) visualizing the localized impact on different city zones.
- **🕸️ Interactive Knowledge Graph**: Visually trace the exact data sources, datasets, and relationships grounding the AI's decisions.
- **🏆 Community Leaderboard**: Discover, rank, and instantly run the most impactful scenarios explored by other users.
- **📊 Smart Report Cards & PDF Export**: Instantly generate high-quality, shareable 1200x630 social media cards or comprehensive PDF reports for any scenario.
- **🎙️ AI Voice Dictation**: Hands-free scenario input using the Web Speech API.
- **🌍 Full Localization**: Native UI and AI analysis support for English, Hindi (हिंदी), and Telugu (తెలుగు).

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS with custom glassmorphism design system
- **Visualizations**: Recharts (Radar/Line charts), React-Leaflet (Maps), React-Force-Graph-2D (Knowledge Graph)
- **Utilities**: html2canvas (Image Export), jsPDF (PDF Export), react-i18next (Localization)

### Backend
- **Framework**: FastAPI (Python)
- **AI/LLM**: Google Gemini (`models/gemini-2.5-flash`) via `google-genai` SDK
- **Architecture**: Async RESTful APIs with strict Pydantic data validation and structured JSON generation.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- A Google Gemini API Key

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Create a .env file and add your Gemini API Key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the FastAPI server
python -m uvicorn app.main:app --reload
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start the Vite dev server
npm run dev
```
*Frontend runs on `http://localhost:5173`*

## 💡 How It Works
1. **Input**: A user dictates or types a scenario (e.g., "What if Hyderabad doubled its metro network?").
2. **Knowledge Retrieval**: The backend maps the query to existing datasets in the Knowledge Graph.
3. **Simulation Engine**: Google Gemini processes the scenario constraints against the verified data.
4. **Structured Output**: The AI strictly returns a Pydantic-validated JSON structure containing scores and detailed metrics.
5. **Visualization**: The frontend parses the structured data to render Maps, Radar Charts, and timeline projections.

---
*Built with ❤️ for a smarter, data-driven future.*
