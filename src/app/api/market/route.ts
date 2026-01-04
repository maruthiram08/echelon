import { NextResponse } from 'next/server';
import { MARKET_SYMBOLS, calculateStatus, type Indicator } from '@/types/indicators';

// Using Yahoo Finance unofficial API via a proxy service
// In production, consider using Finnhub or Alpha Vantage with proper API keys
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

export async function GET() {
    try {
        // Fetch all market data in parallel
        const [vix, oil, gold, copper, usdjpy, move, crb] = await Promise.all([
            fetchYahooQuote(MARKET_SYMBOLS.VIX),
            fetchYahooQuote(MARKET_SYMBOLS.BRENT_OIL),
            fetchYahooQuote(MARKET_SYMBOLS.GOLD),
            fetchYahooQuote(MARKET_SYMBOLS.COPPER),
            fetchYahooQuote(MARKET_SYMBOLS.USDJPY),
            fetchYahooQuote(MARKET_SYMBOLS.MOVE_INDEX),
            fetchYahooQuote(MARKET_SYMBOLS.CRB_INDEX),
        ]);

        // Calculate Gold/Copper ratio
        const goldCopperRatio = gold.price && copper.price
            ? gold.price / copper.price
            : null;

        const indicators: Indicator[] = [
            // Pillar 2: Global Inflation
            {
                id: 'BRENT_OIL',
                name: 'Brent Crude Oil',
                shortName: 'Brent Oil',
                value: oil.price,
                previousValue: oil.previousClose ?? undefined,
                change: oil.price && oil.previousClose ? oil.price - oil.previousClose : undefined,
                changePercent: oil.price && oil.previousClose
                    ? ((oil.price - oil.previousClose) / oil.previousClose) * 100
                    : undefined,
                unit: '$/bbl',
                status: calculateStatus('BRENT_OIL', oil.price),
                description: '>$80 = INR crisis, <$60 = Relief',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'GOLD',
                name: 'Gold Price',
                shortName: 'Gold',
                value: gold.price,
                previousValue: gold.previousClose ?? undefined,
                change: gold.price && gold.previousClose ? gold.price - gold.previousClose : undefined,
                changePercent: gold.price && gold.previousClose
                    ? ((gold.price - gold.previousClose) / gold.previousClose) * 100
                    : undefined,
                unit: '$/oz',
                status: calculateStatus('GOLD', gold.price),
                description: 'Rising = Risk-off globally',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'CRB_INDEX',
                name: 'CRB Commodity Index',
                shortName: 'CRB Index',
                value: crb.price,
                previousValue: crb.previousClose ?? undefined,
                change: crb.price && crb.previousClose ? crb.price - crb.previousClose : undefined,
                changePercent: crb.price && crb.previousClose
                    ? ((crb.price - crb.previousClose) / crb.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateStatus('CRB_INDEX', crb.price),
                description: 'Global raw material costs (DBC proxy)',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },

            // Pillar 3: Global Growth
            {
                id: 'COPPER',
                name: 'Copper Price',
                shortName: 'Copper',
                value: copper.price,
                previousValue: copper.previousClose ?? undefined,
                change: copper.price && copper.previousClose ? copper.price - copper.previousClose : undefined,
                changePercent: copper.price && copper.previousClose
                    ? ((copper.price - copper.previousClose) / copper.previousClose) * 100
                    : undefined,
                unit: '$/lb',
                status: calculateStatus('COPPER', copper.price),
                description: '>$4/lb = Global expansion',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },

            // Pillar 4: Global Risk
            {
                id: 'VIX',
                name: 'VIX (Fear Index)',
                shortName: 'VIX',
                value: vix.price,
                previousValue: vix.previousClose ?? undefined,
                change: vix.price && vix.previousClose ? vix.price - vix.previousClose : undefined,
                changePercent: vix.price && vix.previousClose
                    ? ((vix.price - vix.previousClose) / vix.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateStatus('VIX', vix.price),
                description: '>30 = FII panic selling',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'GOLD_COPPER_RATIO',
                name: 'Gold/Copper Ratio',
                shortName: 'Au/Cu Ratio',
                value: goldCopperRatio,
                unit: '',
                status: calculateStatus('GOLD_COPPER_RATIO', goldCopperRatio),
                description: '>500 = Risk-off dominance',
                source: 'CALCULATED',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'USDJPY',
                name: 'USD/JPY',
                shortName: 'USD/JPY',
                value: usdjpy.price,
                previousValue: usdjpy.previousClose ?? undefined,
                change: usdjpy.price && usdjpy.previousClose ? usdjpy.price - usdjpy.previousClose : undefined,
                changePercent: usdjpy.price && usdjpy.previousClose
                    ? ((usdjpy.price - usdjpy.previousClose) / usdjpy.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateStatus('USDJPY', usdjpy.price),
                description: 'Falling = Carry unwind = EM sell-off',
                source: 'YAHOO',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'MOVE_INDEX',
                name: 'MOVE Index (Bond Vol)',
                shortName: 'MOVE',
                value: move.price,
                previousValue: move.previousClose ?? undefined,
                change: move.price && move.previousClose ? move.price - move.previousClose : undefined,
                changePercent: move.price && move.previousClose
                    ? ((move.price - move.previousClose) / move.previousClose) * 100
                    : undefined,
                unit: '',
                status: calculateStatus('MOVE_INDEX', move.price),
                description: '>120 = Treasury market stress',
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
        console.error('Market API route error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch market data' },
            { status: 500 }
        );
    }
}
