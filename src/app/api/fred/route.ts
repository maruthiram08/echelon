import { NextResponse } from 'next/server';
import { FRED_SERIES, calculateStatus, type Indicator } from '@/types/indicators';

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

interface FREDObservation {
    date: string;
    value: string;
}

interface FREDResponse {
    observations: FREDObservation[];
}

async function fetchFREDSeries(seriesId: string): Promise<{ value: number | null; date: string }> {
    const apiKey = process.env.FRED_API_KEY;

    if (!apiKey) {
        console.error('FRED_API_KEY not configured');
        return { value: null, date: new Date().toISOString() };
    }

    const params = new URLSearchParams({
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit: '5', // Get last 5 observations to handle missing data
    });

    try {
        const response = await fetch(`${FRED_API_BASE}?${params}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour (FRED updates daily)
        });

        if (!response.ok) {
            throw new Error(`FRED API error: ${response.status}`);
        }

        const data: FREDResponse = await response.json();

        // Find the most recent non-empty value
        const validObs = data.observations.find(obs => obs.value !== '.');

        if (validObs) {
            return {
                value: parseFloat(validObs.value),
                date: validObs.date,
            };
        }

        return { value: null, date: new Date().toISOString() };
    } catch (error) {
        console.error(`Error fetching FRED series ${seriesId}:`, error);
        return { value: null, date: new Date().toISOString() };
    }
}

export async function GET() {
    try {
        // Fetch all FRED series in parallel
        const [us10y, us2y, fedFunds, dxy, tipsBreakeven, hySpread, usPmi, globalPmi, chinaPmi, euPmi] = await Promise.all([
            fetchFREDSeries(FRED_SERIES.US_10Y),
            fetchFREDSeries(FRED_SERIES.US_2Y),
            fetchFREDSeries(FRED_SERIES.FED_FUNDS),
            fetchFREDSeries(FRED_SERIES.DXY),
            fetchFREDSeries(FRED_SERIES.TIPS_BREAKEVEN),
            fetchFREDSeries(FRED_SERIES.HY_SPREAD),
            fetchFREDSeries(FRED_SERIES.US_PMI),
            fetchFREDSeries(FRED_SERIES.GLOBAL_PMI),
            fetchFREDSeries(FRED_SERIES.CHINA_PMI),
            fetchFREDSeries(FRED_SERIES.EU_PMI),
        ]);

        // Calculate derived indicators
        const spread2s10s = us10y.value !== null && us2y.value !== null
            ? us10y.value - us2y.value
            : null;

        const realYield = us10y.value !== null && tipsBreakeven.value !== null
            ? us10y.value - tipsBreakeven.value
            : null;

        const indicators: Indicator[] = [
            // Pillar 1: Global Interest Rates
            {
                id: 'US_10Y',
                name: 'US 10-Year Treasury',
                shortName: 'US 10Y',
                value: us10y.value,
                unit: '%',
                status: calculateStatus('US_10Y', us10y.value),
                description: '>4% = FII outflows, <3% = FII buying',
                source: 'FRED',
                lastUpdated: us10y.date,
            },
            {
                id: 'US_2Y',
                name: 'US 2-Year Treasury',
                shortName: 'US 2Y',
                value: us2y.value,
                unit: '%',
                status: calculateStatus('US_2Y', us2y.value),
                description: 'Fed policy expectations',
                source: 'FRED',
                lastUpdated: us2y.date,
            },
            {
                id: 'SPREAD_2S10S',
                name: '2s10s Yield Spread',
                shortName: '2s10s',
                value: spread2s10s,
                unit: '%',
                status: calculateStatus('SPREAD_2S10S', spread2s10s),
                description: 'Inverted = Recession predictor, Risk-off for EM',
                source: 'CALCULATED',
                lastUpdated: us10y.date,
            },
            {
                id: 'DXY',
                name: 'Dollar Index (DXY)',
                shortName: 'DXY',
                value: dxy.value,
                unit: '',
                status: calculateStatus('DXY', dxy.value),
                description: '>105 = EM crisis, <95 = EM party',
                source: 'FRED',
                lastUpdated: dxy.date,
            },
            {
                id: 'FED_FUNDS',
                name: 'Fed Funds Rate',
                shortName: 'Fed Rate',
                value: fedFunds.value,
                unit: '%',
                status: calculateStatus('FED_FUNDS', fedFunds.value),
                description: 'Global cost of money, vs RBI repo = carry trade appeal',
                source: 'FRED',
                lastUpdated: fedFunds.date,
            },

            // Pillar 2: Global Inflation (from FRED)
            {
                id: 'TIPS_BREAKEVEN',
                name: '10Y TIPS Breakeven',
                shortName: 'Breakeven',
                value: tipsBreakeven.value,
                unit: '%',
                status: calculateStatus('TIPS_BREAKEVEN', tipsBreakeven.value),
                description: '>2.5% = Inflation trade on',
                source: 'FRED',
                lastUpdated: tipsBreakeven.date,
            },
            {
                id: 'REAL_YIELD',
                name: 'Real Yield (10Y - Breakeven)',
                shortName: 'Real Yield',
                value: realYield,
                unit: '%',
                status: calculateStatus('REAL_YIELD', realYield),
                description: '<0% = Financial repression',
                source: 'CALCULATED',
                lastUpdated: us10y.date,
            },

            // Pillar 3: Global Growth (OECD CLI)
            {
                id: 'US_PMI',
                name: 'US Growth (OECD CLI)',
                shortName: 'US Growth',
                value: usPmi.value,
                unit: '',
                status: calculateStatus('US_PMI', usPmi.value),
                description: '>100 = Expansion, <99 = Slowdown',
                source: 'FRED',
                lastUpdated: usPmi.date,
            },
            {
                id: 'GLOBAL_PMI',
                name: 'Global Growth (G7 CLI)',
                shortName: 'Global',
                value: globalPmi.value,
                unit: '',
                status: calculateStatus('GLOBAL_PMI', globalPmi.value),
                description: '>100 = Expansion, <99 = Slowdown',
                source: 'FRED',
                lastUpdated: globalPmi.date,
            },
            {
                id: 'CHINA_PMI',
                name: 'China Growth (OECD CLI)',
                shortName: 'China',
                value: chinaPmi.value,
                unit: '',
                status: calculateStatus('CHINA_PMI', chinaPmi.value),
                description: '>100 = Expansion, <99 = Slowdown',
                source: 'FRED',
                lastUpdated: chinaPmi.date,
            },
            {
                id: 'EU_PMI',
                name: 'Euro Area Growth (CLI)',
                shortName: 'Euro Area',
                value: euPmi.value,
                unit: '',
                status: calculateStatus('EU_PMI', euPmi.value),
                description: '>100 = Expansion, <99 = Slowdown',
                source: 'FRED',
                lastUpdated: euPmi.date,
            },

            // Pillar 4: Global Risk (from FRED)
            {
                id: 'HY_SPREAD',
                name: 'High Yield Spread',
                shortName: 'HY Spread',
                value: hySpread.value,
                unit: 'bps',
                status: calculateStatus('HY_SPREAD', hySpread.value ? hySpread.value * 100 : null),
                description: '>600bps = Credit crisis',
                source: 'FRED',
                lastUpdated: hySpread.date,
            },
        ];

        return NextResponse.json({
            success: true,
            data: indicators,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('FRED API route error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch FRED data' },
            { status: 500 }
        );
    }
}
