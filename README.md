# Echelon - Macro Investing Dashboard

![Echelon Logo](./public/echelon_logo.png)

> **Think Global, Act Indian** — A professional-grade macro intelligence platform for sophisticated investors.

---

## Overview

Echelon is an institutional-quality macro dashboard that synthesizes global economic indicators, correlations, and AI-powered insights to help investors make informed decisions. It bridges the gap between global macro forces and Indian market execution.

## Features

### 🌍 Global Snapshot
- **20+ Live Indicators** across 4 macro pillars:
  - **Rates & Currency**: US 10Y, DXY, Fed Funds, 2s10s Spread
  - **Inflation**: Brent Oil, Gold, CRB Index, TIPS Breakeven
  - **Growth**: US/China/Euro/Global PMI, Copper
  - **Risk Appetite**: VIX, HY Spread, MOVE Index, USD/JPY

### 🔗 Global Insights (Strategic Correlations)
- **12+ Institutional-Grade Correlations** with AI analysis
- **Regime Matrix**: Visual mapping of liquidity vs. stress states
- **Signal Status Badges**: DOMINANT / ACTIVE / DORMANT / CONTRADICTED
- **AI Strategist**: GPT-4o powered "Daily Macro Call"

### 🇮🇳 Indian Snapshot
- **Domestic Indices**: Nifty 50, Bank Nifty, India VIX, USD/INR
- **Quick Links**: Direct access to RBI, CCIL, NSE, MOSPI data sources

### 🎯 Progressive Disclosure
- **Simple Mode**: Beginner-friendly, jargon-free summaries
- **Standard/Pro Mode**: Full institutional analysis with invalidation logic

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| AI | OpenAI GPT-4o |
| Data Fetching | SWR |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/MacroInvestingDashboard.git
cd MacroInvestingDashboard/app

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI insights |

---

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set **Root Directory** to `app`
4. Add `OPENAI_API_KEY` in Environment Variables
5. Deploy

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## First-Time Users

See [FIRST_TIME_USER_GUIDE.md](./FIRST_TIME_USER_GUIDE.md) for a walkthrough.

---

## License

Private / Proprietary

---

**Built with conviction. Designed for clarity.**
