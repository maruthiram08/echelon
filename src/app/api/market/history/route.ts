import { NextResponse } from 'next/server';
import { FRED_SERIES, MARKET_SYMBOLS } from '@/types/indicators';

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';
const HISTORY_RANGE = '1y'; // For Yahoo
const OBSERVATION_START = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // For FRED

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface HistoryPoint {
    date: string;
    value: number;
}

interface HistoryResponse {
    [symbol: string]: HistoryPoint[];
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

/**
 * Fetch history from Yahoo Finance
 */
async function fetchYahooHistory(symbol: string): Promise<HistoryPoint[]> {
    try {
        // range=1y, interval=1d
        const url = `${YAHOO_BASE_URL}/${symbol}?interval=1d&range=${HISTORY_RANGE}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 } // Cache 1h
        });

        if (!response.ok) throw new Error(`Yahoo status: ${response.status}`);

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) return [];

        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0]?.close || [];

        const points: HistoryPoint[] = [];

        timestamps.forEach((ts: number, i: number) => {
            const val = quotes[i];
            if (val !== null && val !== undefined) {
                points.push({
                    date: new Date(ts * 1000).toISOString().split('T')[0],
                    value: val
                });
            }
        });

        return points;
    } catch (error) {
        console.error(`Yahoo history error for ${symbol}:`, error);
        return [];
    }
}

/**
 * Fetch history from FRED
 */
async function fetchFredHistory(seriesId: string): Promise<HistoryPoint[]> {
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

        const url = `${FRED_BASE_URL}?${params.toString()}`;
        const response = await fetch(url, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) throw new Error(`FRED status: ${response.status}`);

        const data = await response.json();
        if (!data.observations) return [];

        return data.observations
            .filter((obs: any) => obs.value !== '.')
            .map((obs: any) => ({
                date: obs.date,
                value: parseFloat(obs.value)
            }));

    } catch (error) {
        console.error(`FRED history error for ${seriesId}:`, error);
        return [];
    }
}

// ----------------------------------------------------------------------------
// ROUTE
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { symbols } = body;

        if (!symbols || !Array.isArray(symbols)) {
            return NextResponse.json({ error: 'Invalid symbols array' }, { status: 400 });
        }

        const results: HistoryResponse = {};

        // Fetch in parallel
        await Promise.all(symbols.map(async (id: string) => {
            // Determine source based on ID matching known constants
            let data: HistoryPoint[] = [];

            // 1. Check FRED
            const fredId = Object.values(FRED_SERIES).find(v => v === id);
            if (fredId) {
                data = await fetchFredHistory(fredId);
            }
            // 2. Check Yahoo (Market Symbols)
            else {
                // Determine Yahoo symbol from constant or pass raw if needed
                // Currently only supporting known market symbols
                const yahooSymbol = Object.entries(MARKET_SYMBOLS).find(([k, v]) => k === id || v === id)?.[1];

                if (yahooSymbol) {
                    data = await fetchYahooHistory(yahooSymbol);
                }
                // Fallback: If ID itself looks like a Yahoo symbol (e.g. ^NSEI)
                else if (id.includes('^') || id.includes('=')) {
                    data = await fetchYahooHistory(id);
                }
            }

            if (data.length > 0) {
                results[id] = data;
            }
        }));

        return NextResponse.json({ success: true, data: results });

    } catch (error) {
        console.error('History API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
