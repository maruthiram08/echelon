'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SnapshotView } from './SnapshotView';
import { CorrelationsView } from './CorrelationsView';
import PillarSection from './PillarSection';
import { QuickLinks } from '@/components/QuickLinks';
import type { Indicator, SignalStatus } from '@/types/indicators';
import { RefreshCw, LayoutGrid, Network } from 'lucide-react';

// Re-export this interface so other files can use it if needed, or import from types
export interface AIInsightV4 {
    regime: { name: string; confidence: string; timeframe: string };
    confidence_score: { drivers: string[] };
    summary: string;
    context: { title: string; content: string }[];
    dominance: { signal: string; reason: string[] };
    strategy: { winners: string[]; losers: string[]; crowded: string[]; what_breaks_first: string[] };
    flip_conditions: { primary: string[]; false_flip: string; confirmation: string };
}

interface DashboardProps {
    globalIndicators: Indicator[];
    indiaIndicators: Indicator[];
    isLoading: boolean;
    isRefreshing: boolean;
    timestamp: string | null;
    onRefresh: () => void;
}

export function Dashboard({
    globalIndicators,
    indiaIndicators,
    isLoading,
    isRefreshing,
    timestamp,
    onRefresh
}: DashboardProps) {
    // ------------------------------------------------------------------------
    // STATE: TABS & INSIGHT
    // ------------------------------------------------------------------------
    const [activeTab, setActiveTab] = useState<'snapshot' | 'correlations' | 'indian'>('snapshot');

    // Insight State (Lifted from PillarSection)
    const [insight, setInsight] = useState<AIInsightV4 | null>(null);
    const [loadingInsight, setLoadingInsight] = useState(false);

    // ------------------------------------------------------------------------
    // ACTIONS
    // ------------------------------------------------------------------------
    const handleGenerateInsight = async (pillar: string, indicators: Indicator[]) => {
        if (loadingInsight) return;
        setLoadingInsight(true);
        setInsight(null); // Clear previous to show loading or make space
        try {
            const res = await fetch('/api/ai-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pillar, indicators }),
            });
            const data = await res.json();
            if (data.analysis) {
                setInsight(data.analysis);
                // Optionally scroll to insight?
            }
        } catch (error) {
            console.error('Insight generation failed:', error);
        } finally {
            setLoadingInsight(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-24">
            {/* ------------------------------------------------------------------
               TOP NAVIGATION
               ------------------------------------------------------------------ */}
            <nav className="sticky top-0 z-50 bg-[#F5F5F7]/90 backdrop-blur-xl border-b border-white/50 mb-8">
                <div className="container mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        {/* Brand */}
                        <div className="flex items-center gap-4">
                            {/* Logo Image */}
                            <div className="relative h-12 w-auto">
                                <img
                                    src="/echelon_logo.png"
                                    alt="Echelon Logo"
                                    className="h-full w-auto object-contain"
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            {timestamp && (
                                <span className="text-[13px] font-medium text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm hidden sm:inline-block">
                                    Last updated: {new Date(timestamp).toLocaleTimeString()}
                                </span>
                            )}
                            <button
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className={cn(
                                    'btn-pill flex items-center gap-2',
                                    isRefreshing && 'opacity-80 cursor-wait'
                                )}
                            >
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------
                       TAB SWITCHER
                       -------------------------------------------------------------- */}
                    {/* --------------------------------------------------------------
               TAB SWITCHER
               -------------------------------------------------------------- */}
                    <div className="mt-8 flex justify-center">
                        <div className="bg-white/60 p-1.5 rounded-full flex items-center gap-1 shadow-sm border border-black/5">
                            <button
                                onClick={() => setActiveTab('snapshot')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                                    activeTab === 'snapshot'
                                        ? "bg-white text-[#111111] shadow-md ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                Global Snapshot
                            </button>
                            <button
                                onClick={() => setActiveTab('correlations')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                                    activeTab === 'correlations'
                                        ? "bg-white text-[#111111] shadow-md ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <Network className="h-4 w-4" />
                                Global Insights
                            </button>
                            <button
                                onClick={() => setActiveTab('indian')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                                    activeTab === 'indian'
                                        ? "bg-white text-[#111111] shadow-md ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <LayoutGrid className="h-4 w-4 text-orange-600" />
                                Indian Snapshot
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ------------------------------------------------------------------
       MAIN CONTENT (TABS)
       ------------------------------------------------------------------ */}
            <main className="container mx-auto px-6">
                {activeTab === 'snapshot' && (
                    <SnapshotView
                        globalIndicators={globalIndicators}
                        indiaIndicators={indiaIndicators}
                        isLoading={isLoading}
                        insight={insight}
                        loadingInsight={loadingInsight}
                        setInsight={setInsight}
                        handleGenerateInsight={handleGenerateInsight}
                    />
                )}

                {activeTab === 'correlations' && (
                    <CorrelationsView
                        globalIndicators={globalIndicators}
                        indiaIndicators={indiaIndicators}
                    />
                )}

                {activeTab === 'indian' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Indian Indices Section */}
                        <div className="space-y-16">
                            <PillarSection
                                title="Indian Indices"
                                description="Key benchmarks for the Indian economy."
                                icon={<LayoutGrid className="h-5 w-5 text-orange-500" />}
                                indicators={indiaIndicators}
                                isLoading={isLoading}
                                columns={4}
                                gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                                disableInsight={true}
                            />
                        </div>

                        {/* Quick Links Section */}
                        <QuickLinks />
                    </div>
                )}
            </main>
        </div>
    );
}
