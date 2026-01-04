# Echelon Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ECHELON DASHBOARD                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Global    │  │   Global    │  │       Indian            │  │
│  │  Snapshot   │  │  Insights   │  │      Snapshot           │  │
│  │  (Bento)    │  │(Correlations│  │  (Indices + Links)      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                │
│         └────────────────┴─────────────────────┘                │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │ Dashboard │                                │
│                    │ Component │                                │
│                    └─────┬─────┘                                │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌───────────────┐
    │ /api/fred │  │/api/market│  │/api/analysis/ │
    │           │  │           │  │ correlations  │
    └─────┬─────┘  └─────┬─────┘  └───────┬───────┘
          │              │                │
          ▼              ▼                ▼
    ┌───────────┐  ┌───────────┐  ┌───────────────┐
    │  FRED API │  │Alpha Vant.│  │   OpenAI API  │
    │  (Fed)    │  │ (Markets) │  │   (gpt-4o)    │
    └───────────┘  └───────────┘  └───────────────┘
```

---

## Directory Structure

```
app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── fred/              # FRED economic data
│   │   │   ├── market/            # Market data (Alpha Vantage)
│   │   │   ├── india/             # Indian indices
│   │   │   ├── ai-insight/        # Pillar-level AI insights
│   │   │   └── analysis/
│   │   │       └── correlations/
│   │   │           ├── route.ts   # Correlation calculation
│   │   │           └── insight/   # AI correlation insights
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   ├── components/
│   │   ├── Dashboard.tsx          # Main orchestrator
│   │   ├── SnapshotView.tsx       # Global Snapshot (Bento)
│   │   ├── CorrelationsView.tsx   # Strategic Relations
│   │   ├── PillarSection.tsx      # Category container
│   │   ├── IndicatorCard.tsx      # Individual metric card
│   │   ├── QuickLinks.tsx         # External data sources
│   │   └── charts/
│   │       ├── RegimeMatrix.tsx   # Liquidity vs Stress scatter
│   │       └── CorrelationChart.tsx
│   ├── lib/
│   │   └── utils.ts               # Utility functions (cn)
│   └── types/
│       └── indicators.ts          # TypeScript interfaces
├── public/
│   └── echelon_logo.png           # Brand logo
└── package.json
```

---

## Data Flow

### 1. Indicator Pipeline
```
User Opens Dashboard
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   /api/fred   │────▶│ Global Rates  │────▶│  Dashboard    │
│   /api/market │────▶│ Inflation     │────▶│  State        │
│   /api/india  │────▶│ Growth, Risk  │────▶│               │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 2. Correlation Engine
```
Dashboard State (Indicators)
        │
        ▼
┌───────────────────────────┐
│ /api/analysis/correlations│
│  - Fetches 1Y history     │
│  - Calculates R values    │
│  - Computes regime matrix │
│  - Returns trend data     │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ /api/analysis/.../insight │
│  - OpenAI gpt-4o          │
│  - Structured JSON output │
│  - Dual summaries (Pro/   │
│    Simple)                │
└───────────────────────────┘
```

---

## Key Components

### Dashboard.tsx
- **Role**: Main orchestrator, manages tab state
- **Tabs**: Global Snapshot | Global Insights | Indian Snapshot
- **State**: `activeTab`, `insight`, `loadingInsight`

### CorrelationsView.tsx
- **Role**: Strategic Relations tab
- **Features**: Regime Matrix, Correlation Cards, AI Commentary
- **State**: `viewMode` (Simple/Standard/Pro), `analysis`

### IndicatorCard.tsx
- **Role**: Individual metric display
- **Features**: Value, Status Dot, Change %, Badge

---

## AI Integration

### Prompt Architecture
```
┌─────────────────────────────────────────┐
│         STRATEGIST PERSONA              │
│  "Senior Global Macro Strategist"       │
├─────────────────────────────────────────┤
│ INPUT:                                  │
│  - Correlation values (R)               │
│  - Trend (Strengthening/Weakening)      │
│  - Current regime                       │
├─────────────────────────────────────────┤
│ OUTPUT (Structured JSON):               │
│  - signal_status                        │
│  - relationship_state                   │
│  - dominant_driver                      │
│  - market_consequence                   │
│  - invalidation                         │
│  - summary_pro                          │
│  - summary_simple                       │
└─────────────────────────────────────────┘
```

### Editorial Rules (Enforced)
1. **No Hedging**: "confirms" not "suggests"
2. **Regime-Aware**: Invalidation references macro state
3. **Delta Lens**: Every insight addresses strengthening/weakening
4. **Stasis Interpretation**: Stable trends explained ("priced in")

---

## Styling System

- **Design Language**: Apple-inspired, Bento aesthetic
- **Colors**: 
  - Green: `#34C759` (Favorable)
  - Red: `#FF3B30` (Alert)
  - Orange: `#FF9500` (Caution)
  - Yellow: `#FFCC00` (Neutral)
- **Typography**: System fonts, bold values
- **Cards**: `rounded-[24px]`, white bg, subtle shadows

---

## Performance

- **SWR**: Client-side caching with stale-while-revalidate
- **Server Components**: Data fetching on server
- **Turbopack**: Fast dev builds
- **Static Generation**: Home page pre-rendered
