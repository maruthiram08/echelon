// Global Macro Indicators - 20 indicators across 4 pillars

export type SignalStatus = 'green' | 'yellow' | 'orange' | 'red';

export interface Indicator {
  id: string;
  name: string;
  shortName: string;
  value: number | null;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  unit: string;
  status: SignalStatus;
  description: string;
  source: 'FRED' | 'FINNHUB' | 'YAHOO' | 'CALCULATED';
  lastUpdated: string;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
  icon: string;
  indicators: Indicator[];
  overallStatus: SignalStatus;
}

// FRED Series IDs for each indicator
export const FRED_SERIES = {
  // Pillar 1: Global Interest Rates
  US_10Y: 'DGS10',           // 10-Year Treasury Constant Maturity Rate
  US_2Y: 'DGS2',             // 2-Year Treasury Constant Maturity Rate
  FED_FUNDS: 'FEDFUNDS',     // Federal Funds Effective Rate
  DXY: 'DTWEXBGS',           // Trade Weighted U.S. Dollar Index

  // Pillar 2: Global Inflation
  TIPS_BREAKEVEN: 'T10YIE',  // 10-Year Breakeven Inflation Rate

  // Pillar 4: Global Risk
  HY_SPREAD: 'BAMLH0A0HYM2', // ICE BofA US High Yield Index Option-Adjusted Spread

  // Pillar 3: Global Growth (OECD CLI Amplitude Adjusted)
  GLOBAL_PMI: 'G7LOLITOAASTSAM',    // G7 CLI
  US_PMI: 'USALOLITOAASTSAM',       // US CLI
  CHINA_PMI: 'CHNLOLITOAASTSAM',    // China CLI
  EU_PMI: 'EA19LOLITOAASTSAM',      // Euro Area CLI
} as const;

// Yahoo Finance / Finnhub symbols
export const MARKET_SYMBOLS = {
  // Pillar 2: Global Inflation
  BRENT_OIL: 'BZ=F',
  GOLD: 'GC=F',
  COPPER: 'HG=F',
  CRB_INDEX: 'DBC', // Invesco DB Commodity Index Tracking Fund (Proxy)

  // Pillar 3: Global Growth (PMI data requires manual input or paid API)

  // Pillar 4: Global Risk
  VIX: '^VIX',
  USDJPY: 'USDJPY=X',
  MOVE_INDEX: '^MOVE',
} as const;

// Threshold configuration for signal status
export interface ThresholdConfig {
  green: [number, number];  // [min, max] - within range = green
  yellow: [number, number]; // warning zone
  red: number;              // beyond this = red (can be direction-dependent)
  invertLogic?: boolean;    // if true, lower is worse (e.g., PMI below 50)
}

export const THRESHOLDS: Record<string, ThresholdConfig> = {
  // Pillar 1: Global Interest Rates
  US_10Y: { green: [2, 4], yellow: [4, 5], red: 5 },
  US_2Y: { green: [2, 4.5], yellow: [4.5, 5.5], red: 5.5 },
  SPREAD_2S10S: { green: [0, 2], yellow: [-0.5, 0], red: -0.5, invertLogic: true },
  DXY: { green: [95, 105], yellow: [105, 108], red: 108 },
  FED_FUNDS: { green: [2, 4], yellow: [4, 5.5], red: 5.5 },

  // Pillar 2: Global Inflation  
  TIPS_BREAKEVEN: { green: [1.5, 2.5], yellow: [2.5, 3], red: 3 },
  BRENT_OIL: { green: [40, 80], yellow: [80, 90], red: 90 },
  GOLD: { green: [1500, 2000], yellow: [2000, 2200], red: 2200 },
  REAL_YIELD: { green: [0.5, 2], yellow: [0, 0.5], red: 0, invertLogic: true },
  CRB_INDEX: { green: [15, 25], yellow: [25, 30], red: 30 },

  // Pillar 3: Global Growth (CLI > 100 = Expansion)
  GLOBAL_PMI: { green: [100, 105], yellow: [99, 100], red: 99, invertLogic: true },
  US_PMI: { green: [100, 105], yellow: [99, 100], red: 99, invertLogic: true },
  CHINA_PMI: { green: [100, 105], yellow: [99, 100], red: 99, invertLogic: true },
  EU_PMI: { green: [100, 105], yellow: [99, 100], red: 99, invertLogic: true },
  COPPER: { green: [3.5, 4.5], yellow: [3, 3.5], red: 3, invertLogic: true },

  // Pillar 4: Global Risk
  VIX: { green: [12, 20], yellow: [20, 30], red: 30 },
  GOLD_COPPER_RATIO: { green: [400, 500], yellow: [500, 550], red: 550 },
  USDJPY: { green: [110, 145], yellow: [145, 150], red: 150 },
  HY_SPREAD: { green: [300, 450], yellow: [450, 600], red: 600 },
  MOVE_INDEX: { green: [0, 120], yellow: [120, 150], red: 150 },
};

// Calculate signal status based on thresholds
export function calculateStatus(id: string, value: number | null): SignalStatus {
  if (value === null) return 'yellow';

  const config = THRESHOLDS[id];
  if (!config) return 'yellow';

  const { green, yellow, red, invertLogic } = config;

  if (invertLogic) {
    // Lower values are worse (e.g., PMI, inverted yield curve)
    if (value < red) return 'red';
    if (value >= yellow[0] && value <= yellow[1]) return 'yellow';
    if (value >= green[0] && value <= green[1]) return 'green';
    return 'orange';
  } else {
    // Higher values are worse (e.g., VIX, rates)
    if (value > red) return 'red';
    if (value >= green[0] && value <= green[1]) return 'green';
    if (value >= yellow[0] && value <= yellow[1]) return 'yellow';
    return 'orange';
  }
}

// Aggregate multiple indicator statuses into overall pillar status
export function aggregateStatus(statuses: SignalStatus[]): SignalStatus {
  const counts = { red: 0, orange: 0, yellow: 0, green: 0 };
  statuses.forEach(s => counts[s]++);

  if (counts.red >= 2) return 'red';
  if (counts.red >= 1 || counts.orange >= 2) return 'orange';
  if (counts.orange >= 1 || counts.yellow >= 2) return 'yellow';
  return 'green';
}

// Market regime based on all pillars
export type MarketRegime =
  | 'GLOBAL_GOLDILOCKS'     // Everything favorable
  | 'GLOBAL_STRESS'          // Elevated risk signals
  | 'GLOBAL_CRISIS'          // Multiple red signals
  | 'MIXED_SIGNALS';         // Mixed conditions
