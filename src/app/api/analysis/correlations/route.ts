import { NextResponse } from 'next/server';
import { FRED_SERIES, MARKET_SYMBOLS } from '@/types/indicators';

// ----------------------------------------------------------------------------
// CONFIG & CONSTANTS
// ----------------------------------------------------------------------------
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';
const HISTORY_RANGE = '1y';
const OBSERVATION_START = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

interface DataPoint {
    date: string;
    value: number;
}

interface CorrelationResult {
    id: string;
    name: string;
    correlation: number;
    trend: 'Strengthening' | 'Weakening' | 'Stable';
    series: { date: string; x: number; y: number }[];
    description: string;
    pillar: string;
}

interface RegimePoint {
    date: string;
    liquidity_score: number;
    stress_score: number;
    regime: string;
}

// ----------------------------------------------------------------------------
// FETCH HELPERS
// ----------------------------------------------------------------------------
async function fetchYahooHistory(symbol: string): Promise<DataPoint[]> {
    try {
        const url = `${YAHOO_BASE_URL}/${symbol}?interval=1d&range=${HISTORY_RANGE}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result) return [];

        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0]?.close || [];

        const points: DataPoint[] = [];
        timestamps.forEach((ts: number, i: number) => {
            if (quotes[i] != null) {
                points.push({
                    date: new Date(ts * 1000).toISOString().split('T')[0],
                    value: quotes[i]
                });
            }
        });
        return points;
    } catch (e) {
        console.error(`Yahoo history error ${symbol}:`, e);
        return [];
    }
}

async function fetchFredHistory(seriesId: string): Promise<DataPoint[]> {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) return [];

    try {
        const params = new URLSearchParams({
            series_id: seriesId,
            api_key: apiKey,
            file_type: 'json',
            observation_start: OBSERVATION_START,
            sort_order: 'asc'
        });
        const res = await fetch(`${FRED_BASE_URL}?${params}`, { next: { revalidate: 3600 } });
        const data = await res.json();

        if (!data.observations) return [];
        return data.observations
            .filter((o: any) => o.value !== '.')
            .map((o: any) => ({
                date: o.date,
                value: parseFloat(o.value)
            }));
    } catch (e) {
        console.error(`FRED history error ${seriesId}:`, e);
        return [];
    }
}

// ----------------------------------------------------------------------------
// DATA TRANSFORMS (Fixed for Monthly/Daily Alignment)
// ----------------------------------------------------------------------------

function isMonthly(s: DataPoint[]) {
    if (s.length < 5) return false;
    // Check avg gap. If > 20 days.
    const d1 = new Date(s[0].date).getTime();
    const dEnd = new Date(s[s.length - 1].date).getTime();
    const avgGap = (dEnd - d1) / (s.length - 1);
    return avgGap > 1000 * 3600 * 24 * 20;
}

function forwardFillToDaily(monthly: DataPoint[], dailyRef: DataPoint[]): DataPoint[] {
    const filled: DataPoint[] = [];
    let lastValue: number | null = null;
    let mIdx = 0;

    // Safety check for empty arrays
    if (dailyRef.length === 0 || monthly.length === 0) return [];

    const sortedRef = [...dailyRef].sort((a, b) => a.date.localeCompare(b.date));
    const sortedMonthly = [...monthly].sort((a, b) => a.date.localeCompare(b.date));

    // Initialize lastValue with the first monthly value if daily starts later
    if (sortedMonthly.length > 0 && sortedMonthly[0].date <= sortedRef[0].date) {
        lastValue = sortedMonthly[0].value;
    }

    for (const dPoint of sortedRef) {
        // While monthly date <= daily date, update lastValue
        while (mIdx < sortedMonthly.length && sortedMonthly[mIdx].date <= dPoint.date) {
            lastValue = sortedMonthly[mIdx].value;
            mIdx++;
        }

        if (lastValue !== null) {
            filled.push({
                date: dPoint.date,
                value: lastValue
            });
        }
    }
    return filled;
}

function alignSeries(seriesA: DataPoint[], seriesB: DataPoint[]) {
    // Check frequency mismatches
    if (seriesA.length === 0 || seriesB.length === 0) return [];

    let targetA = seriesA;
    let targetB = seriesB;

    const aMonthly = isMonthly(seriesA);
    const bMonthly = isMonthly(seriesB);

    if (aMonthly && !bMonthly) {
        targetA = forwardFillToDaily(seriesA, seriesB);
    } else if (!aMonthly && bMonthly) {
        targetB = forwardFillToDaily(seriesB, seriesA);
    }

    // Now inner join
    const mapA = new Map(targetA.map(p => [p.date, p.value]));
    const commonDatePoints: { date: string; x: number; y: number }[] = [];

    targetB.forEach(p => {
        if (mapA.has(p.date)) {
            commonDatePoints.push({
                date: p.date,
                x: mapA.get(p.date)!,
                y: p.value
            });
        }
    });
    return commonDatePoints.sort((a, b) => a.date.localeCompare(b.date));
}

function calculateCorrelation(data: { x: number; y: number }[]): number {
    const n = data.length;
    if (n < 2) return 0;
    const sumX = data.reduce((acc, p) => acc + p.x, 0);
    const sumY = data.reduce((acc, p) => acc + p.y, 0);
    const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumX2 = data.reduce((acc, p) => acc + p.x * p.x, 0);
    const sumY2 = data.reduce((acc, p) => acc + p.y * p.y, 0);
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
}

function toPctChange(series: DataPoint[]): DataPoint[] {
    if (series.length < 2) return [];
    const result: DataPoint[] = [];
    for (let i = 1; i < series.length; i++) {
        const prev = series[i - 1].value;
        const curr = series[i].value;
        if (prev !== 0) {
            result.push({
                date: series[i].date,
                value: (curr - prev) / prev
            });
        }
    }
    return result;
}

function calculateZScore(values: number[]): number[] {
    const n = values.length;
    if (n < 2) return values.map(() => 0);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);
    return values.map(v => stdDev === 0 ? 0 : (v - mean) / stdDev);
}

// ----------------------------------------------------------------------------
// POST HANDLER
// ----------------------------------------------------------------------------
export async function POST() {
    try {
        // 1. Fetch ALL Required Data (Parallel)
        const [
            us10y, us2y, fedFunds, dxy, hySpread, tips, // FRED
            globalPmi, usPmi, chinaPmi, euPmi, // FRED CLI
            brent, gold, copper, crb, vix, move, usdinr // Yahoo
        ] = await Promise.all([
            fetchFredHistory(FRED_SERIES.US_10Y || 'DGS10'),
            fetchFredHistory(FRED_SERIES.US_2Y || 'DGS2'),
            fetchFredHistory(FRED_SERIES.FED_FUNDS || 'FEDFUNDS'),
            fetchFredHistory('DTWEXBGS'),
            fetchFredHistory(FRED_SERIES.HY_SPREAD || 'BAMLH0A0HYM2'),
            fetchFredHistory(FRED_SERIES.TIPS_BREAKEVEN || 'T10YIE'),
            fetchFredHistory(FRED_SERIES.GLOBAL_PMI),
            fetchFredHistory(FRED_SERIES.US_PMI),
            fetchFredHistory(FRED_SERIES.CHINA_PMI),
            fetchFredHistory(FRED_SERIES.EU_PMI),
            fetchYahooHistory(MARKET_SYMBOLS.BRENT_OIL || 'BZ=F'),
            fetchYahooHistory(MARKET_SYMBOLS.GOLD || 'GC=F'),
            fetchYahooHistory(MARKET_SYMBOLS.COPPER || 'HG=F'),
            fetchYahooHistory(MARKET_SYMBOLS.CRB_INDEX || 'DBC'),
            fetchYahooHistory(MARKET_SYMBOLS.VIX || '^VIX'),
            fetchYahooHistory(MARKET_SYMBOLS.MOVE_INDEX || '^MOVE'),
            fetchYahooHistory('INR=X'),
        ]);

        const yahooDxy = await fetchYahooHistory('DX-Y.NYB');
        const dxyData = yahooDxy.length > dxy.length ? yahooDxy : (dxy.length > 0 ? dxy : yahooDxy);

        // Pre-Calculations
        const spread2s10s = alignSeries(us10y, us2y).map(p => ({ date: p.date, value: p.x - p.y }));
        const realYield = alignSeries(us10y, tips).map(p => ({ date: p.date, value: p.x - p.y }));

        // 2. CORRELATIONS "GOLDEN SET"
        const correlations: CorrelationResult[] = [];

        const addCorr = (
            id: string, name: string, desc: string, pillar: string,
            seriesA: DataPoint[], seriesB: DataPoint[],
            transform: 'raw' | 'pct' = 'raw'
        ) => {
            const finalA = transform === 'pct' ? toPctChange(seriesA) : seriesA;
            const finalB = transform === 'pct' ? toPctChange(seriesB) : seriesB;
            const aligned = alignSeries(finalA, finalB);

            // Calculate Trend
            const n = aligned.length;
            let rCurrent = 0;
            let trend: 'Strengthening' | 'Weakening' | 'Stable' = 'Stable';

            if (n > 60) {
                // Last 60 days
                const currentSlice = aligned.slice(-60);
                // Prior 60 days (offset by 60)
                const priorSlice = aligned.slice(-120, -60);

                rCurrent = calculateCorrelation(currentSlice);
                const rPrior = calculateCorrelation(priorSlice);

                const diff = Math.abs(rCurrent) - Math.abs(rPrior);
                if (diff > 0.1) trend = 'Strengthening';
                else if (diff < -0.1) trend = 'Weakening';
            } else {
                rCurrent = calculateCorrelation(aligned);
            }

            correlations.push({
                id, name, description: desc, pillar,
                series: aligned,
                correlation: rCurrent,
                trend
            });
        };

        // --- PILLAR 1: RATES ---
        addCorr('US10Y_DXY', 'US 10Y vs DXY', 'Tightening Liquidity Check', 'Rates', us10y, dxyData, 'pct');
        addCorr('US2Y_FED', 'US 2Y vs Fed Funds', 'Policy Divergence', 'Rates', us2y, fedFunds, 'raw');
        addCorr('2S10S_VIX', '2s10s vs VIX', 'Recession Risk to Fear', 'Rates', spread2s10s, vix, 'raw');
        addCorr('REAL_GOLD', 'Real Yield vs Gold', 'Valuation Pressure', 'Rates', realYield, gold, 'raw');

        // --- PILLAR 2: INFLATION ---
        addCorr('BRENT_TIPS', 'Brent vs TIPS Breakeven', 'Energy Pass-through', 'Inflation', brent, tips, 'raw');
        addCorr('BRENT_DXY', 'Brent vs DXY', 'Global Tightening Stress', 'Inflation', brent, dxyData, 'raw');
        addCorr('CRB_PMI', 'CRB Index vs Global PMI', 'Demand Pull check', 'Inflation', crb, globalPmi, 'raw');

        // --- PILLAR 3: GROWTH ---
        addCorr('GLOBAL_COPPER', 'Global Growth (CLI) vs Copper', 'Industrial Confirmation', 'Growth', globalPmi, copper, 'raw');
        addCorr('CHINA_COPPER', 'China Growth (CLI) vs Copper', 'China Demand check', 'Growth', chinaPmi, copper, 'raw');
        addCorr('US_DXY', 'US Growth (CLI) vs DXY', 'US Exceptionalism', 'Growth', usPmi, dxyData, 'raw');

        // --- PILLAR 4: RISK ---
        addCorr('VIX_HY', 'VIX vs HY Spread', 'Equity vs Credit Fear', 'Risk', vix, hySpread, 'raw');
        addCorr('MOVE_VIX', 'MOVE vs VIX', 'Bond leads Equity Stress', 'Risk', move, vix, 'raw');
        addCorr('USDJPY_VIX', 'USDJPY vs VIX', 'Carry Trade Unwind', 'Risk', usdinr, vix, 'raw');

        // 3. REGIME MATRIX
        const regimeMap = new Map<string, { dxy?: number, real?: number, move?: number, inr?: number, vix?: number }>();
        const addToMap = (date: string, key: string, val: number) => {
            if (!regimeMap.has(date)) regimeMap.set(date, {});
            (regimeMap.get(date) as any)[key] = val;
        };

        dxyData.forEach(p => addToMap(p.date, 'dxy', p.value));
        realYield.forEach(p => addToMap(p.date, 'real', p.value));
        move.forEach(p => addToMap(p.date, 'move', p.value));
        usdinr.forEach(p => addToMap(p.date, 'inr', p.value));
        vix.forEach(p => addToMap(p.date, 'vix', p.value));

        const regimePoints: RegimePoint[] = [];
        const sortedDates = Array.from(regimeMap.keys()).sort();

        const rDxy: number[] = [], rReal: number[] = [], rMove: number[] = [], rInr: number[] = [], rVix: number[] = [];
        const rDates: string[] = [];

        sortedDates.forEach(d => {
            const v = regimeMap.get(d)!;
            if (v.dxy !== undefined && v.real !== undefined && v.move !== undefined && v.inr !== undefined && v.vix !== undefined) {
                rDxy.push(v.dxy); rReal.push(v.real); rMove.push(v.move); rInr.push(v.inr); rVix.push(v.vix);
                rDates.push(d);
            }
        });

        const zDxy = calculateZScore(rDxy);
        const zReal = calculateZScore(rReal);
        const zMove = calculateZScore(rMove);
        const zInr = calculateZScore(rInr);
        const zVix = calculateZScore(rVix);

        rDates.forEach((d, i) => {
            const liqStress = zDxy[i] + zReal[i] + zMove[i];
            const indStress = zInr[i] + zVix[i];
            let regime = 'NEUTRAL';
            if (liqStress < -1 && indStress < -1) regime = 'RISK_ON';
            else if (liqStress > 1 && indStress > 1) regime = 'CRISIS';
            else if (liqStress > 1) regime = 'DEFENSIVE';

            regimePoints.push({
                date: d,
                liquidity_score: liqStress,
                stress_score: indStress,
                regime
            });
        });

        return NextResponse.json({
            success: true,
            correlations,
            regime_matrix: regimePoints.slice(-60)
        });

    } catch (e) {
        console.error('Phase 8 API Error:', e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
