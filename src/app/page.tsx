'use client';

import { Dashboard } from '@/components/Dashboard';
import { useAllIndicators, refreshAllData } from '@/lib/hooks/useMarketData';

export default function Home() {
  const { globalIndicators, indiaIndicators, isLoading, isRefreshing, timestamp, error } = useAllIndicators();

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Error Loading Data</h1>
          <p className="text-zinc-500 mt-2">{error}</p>
          <button
            onClick={refreshAllData}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      globalIndicators={globalIndicators}
      indiaIndicators={indiaIndicators}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      timestamp={timestamp}
      onRefresh={refreshAllData}
    />
  );
}
