'use client';

import useSWR, { mutate } from 'swr';
import type { Indicator } from '@/types/indicators';

interface ApiResponse {
    success: boolean;
    data: Indicator[];
    timestamp: string;
    error?: string;
}

const fetcher = async (url: string): Promise<ApiResponse> => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

// Hook for FRED data (rates, DXY, spreads)
export function useFREDData() {
    const { data, error, isLoading, isValidating } = useSWR<ApiResponse>(
        '/api/fred',
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000,
        }
    );

    return {
        indicators: data?.data ?? [],
        timestamp: data?.timestamp,
        isLoading,
        isRefreshing: isValidating,
        error: error?.message || data?.error,
    };
}

// Hook for market data (VIX, Oil, Gold, etc.)
export function useMarketData() {
    const { data, error, isLoading, isValidating } = useSWR<ApiResponse>(
        '/api/market',
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000,
        }
    );

    return {
        indicators: data?.data ?? [],
        timestamp: data?.timestamp,
        isLoading,
        isRefreshing: isValidating,
        error: error?.message || data?.error,
    };
}

// Hook for India market data (Nifty, Bank Nifty, USD/INR, India VIX)
export function useIndiaData() {
    const { data, error, isLoading, isValidating } = useSWR<ApiResponse>(
        '/api/india',
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000,
        }
    );

    return {
        indicators: data?.data ?? [],
        timestamp: data?.timestamp,
        isLoading,
        isRefreshing: isValidating,
        error: error?.message || data?.error,
    };
}

// Combined hook for all global indicators
export function useGlobalIndicators() {
    const fred = useFREDData();
    const market = useMarketData();

    const allIndicators = [...fred.indicators, ...market.indicators];

    const isLoading = fred.isLoading || market.isLoading;
    const isRefreshing = fred.isRefreshing || market.isRefreshing;
    const hasError = fred.error || market.error;

    const timestamps = [fred.timestamp, market.timestamp].filter(Boolean);
    const latestTimestamp = timestamps.length > 0
        ? new Date(Math.max(...timestamps.map(t => new Date(t!).getTime()))).toISOString()
        : null;

    return {
        indicators: allIndicators,
        timestamp: latestTimestamp,
        isLoading,
        isRefreshing,
        error: hasError,
    };
}

// Combined hook for all data (Global + India)
export function useAllIndicators() {
    const fred = useFREDData();
    const market = useMarketData();
    const india = useIndiaData();

    const globalIndicators = [...fred.indicators, ...market.indicators];
    const indiaIndicators = india.indicators;

    const isLoading = fred.isLoading || market.isLoading || india.isLoading;
    const isRefreshing = fred.isRefreshing || market.isRefreshing || india.isRefreshing;
    const hasError = fred.error || market.error || india.error;

    const timestamps = [fred.timestamp, market.timestamp, india.timestamp].filter(Boolean);
    const latestTimestamp = timestamps.length > 0
        ? new Date(Math.max(...timestamps.map(t => new Date(t!).getTime()))).toISOString()
        : null;

    return {
        globalIndicators,
        indiaIndicators,
        allIndicators: [...globalIndicators, ...indiaIndicators],
        timestamp: latestTimestamp,
        isLoading,
        isRefreshing,
        error: hasError,
    };
}

// Manual refresh function
export function refreshAllData() {
    mutate('/api/fred');
    mutate('/api/market');
    mutate('/api/india');
}

