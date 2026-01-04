import { NextResponse } from 'next/server';
import { calculateStatus, type Indicator } from '@/types/indicators';

// Yahoo Finance symbols for Indian markets
const INDIA_SYMBOLS = {
    NIFTY: '^NSEI',
    BANK_NIFTY: '^NSEBANK',
    INDIA_VIX: '^INDIAVIX',
    USD_INR: 'INR=X',
} as const;

const YAHOO_QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

interface YahooChartResult {
    meta: {
        regularMarketPrice: number;
        previousClose: number;
        symbol: string;
    };
}

interface YahooResponse {
    chart: {
        result: YahooChartResult[] | null;
        error: { code: string; description: string } | null;
    };
}

async function fetchYahooQuote(symbol: string): Promise<{
    price: number | null;
    previousClose: number | null;
}> {
    try {
        const response = await fetch(`${YAHOO_QUOTE_URL}/${symbol}?interval=1d&range=1d`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            throw new Error(`Yahoo API error: ${response.status}`);
        }

        const data: YahooResponse = await response.json();

        if (data.chart.error || !data.chart.result?.[0]) {
            return { price: null, previousClose: null };
        }

        const result = data.chart.result[0];
        return {
            price: result.meta.regularMarketPrice,
            previousClose: result.meta.previousClose,
        };
    } catch (error) {
        console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
        return { price: null, previousClose: null };
    }
}

// Indian-specific thresholds
const INDIA_THRESHOLDS: Record<string, { green: [number, number]; yellow: [number, number]; red: number; invertLogic?: boolean }> = {
    USD_INR: { green: [74, 78], yellow: [78, 82], red: 82 },
    NIFTY: { green: [18000, 30000], yellow: [15000, 18000], red: 15000, invertLogic: true },
    BANK_NIFTY: { green: [40000, 60000], yellow: [35000, 40000], red: 35000, invertLogic: true },
    INDIA_VIX: { green: [12, 18], yellow: [18, 25], red: 25 },
};

function calculateIndiaStatus(id: string, value: number | null): 'green' | 'yellow' | 'orange' | 'red' {
    if (value === null) return 'yellow';

    const config = INDIA_THRESHOLDS[id];
    if (!config) return 'yellow';

    const { green, yellow, red, invertLogic } = config;

    if (invertLogic) {
        if (value < red) return 'red';
        if (value >= yellow[0] && value <= yellow[1]) return 'yellow';
        if (value >= green[0] && value <= green[1]) return 'green';
        return 'orange';
    } else {
        if (value > red) return 'red';
        if (value >= green[0] && value <= green[1]) return 'green';
        if (value >= yellow[0] && value <= yellow[1]) return 'yellow';
        return 'orange';
    }
}

export async function GET() {
    try {
        // Fetch all Indian market data in parallel
        const [nifty, bankNifty, indiaVix, usdInr] = await Promise.all([
            fetchYahooQuote(INDIA_SYMBOLS.NIFTY),
            fetchYahooQuote(INDIA_SYMBOLS.BANK_NIFTY),
            fetchYahooQuote(INDIA_SYMBOLS.INDIA_VIX),
            fetchYahooQuote(INDIA_SYMBOLS.USD_INR),
        ]);

        const indicators: Indicator[] = [
            // Indian Markets
            {
                id: 'NIFTY',
                name: 'Nifty 50',
                shortName: 'Nifty 50',
                value: nifty.price,
                previousValue: nifty.previousClose ?? undefined,
                change: nifty.price && nifty.previousClose ? nifty.price - nifty.previousClose : undefined,
                changePercent: nifty.price && nifty.previousClose
                    ? ((nifty.price - nifty.previousClose) / nifty.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateIndiaStatus('NIFTY', nifty.price),
                description: 'Benchmark Indian equity index',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'BANK_NIFTY',
                name: 'Bank Nifty',
                shortName: 'Bank Nifty',
                value: bankNifty.price,
                previousValue: bankNifty.previousClose ?? undefined,
                change: bankNifty.price && bankNifty.previousClose ? bankNifty.price - bankNifty.previousClose : undefined,
                changePercent: bankNifty.price && bankNifty.previousClose
                    ? ((bankNifty.price - bankNifty.previousClose) / bankNifty.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateIndiaStatus('BANK_NIFTY', bankNifty.price),
                description: 'Rate sensitivity gauge - Rising = rate cuts expected',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'USD_INR',
                name: 'USD/INR Exchange Rate',
                shortName: 'USD/INR',
                value: usdInr.price,
                previousValue: usdInr.previousClose ?? undefined,
                change: usdInr.price && usdInr.previousClose ? usdInr.price - usdInr.previousClose : undefined,
                changePercent: usdInr.price && usdInr.previousClose
                    ? ((usdInr.price - usdInr.previousClose) / usdInr.previousClose) * 100
                    : undefined,
                unit: '₹',
                status: calculateIndiaStatus('USD_INR', usdInr.price),
                description: '>82 = Currency stress, <76 = Stable',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'INDIA_VIX',
                name: 'India VIX',
                shortName: 'India VIX',
                value: indiaVix.price,
                previousValue: indiaVix.previousClose ?? undefined,
                change: indiaVix.price && indiaVix.previousClose ? indiaVix.price - indiaVix.previousClose : undefined,
                changePercent: indiaVix.price && indiaVix.previousClose
                    ? ((indiaVix.price - indiaVix.previousClose) / indiaVix.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateIndiaStatus('INDIA_VIX', indiaVix.price),
                description: '>25 = Election/crisis, <15 = Complacency',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
        ];

        return NextResponse.json({
            success: true,
            data: indicators,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('India API route error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch India market data' },
            { status: 500 }
        );
    }
}
