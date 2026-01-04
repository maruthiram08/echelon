import React from 'react';
import { Indicator } from '@/types/indicators';
import PillarSection from './PillarSection';
import { cn } from '@/lib/utils';
import { AIInsightV4 } from './Dashboard';
import ReactMarkdown from 'react-markdown';
import { X, Sparkles, AlertCircle, TrendingUp, AlertTriangle, Info, ChevronDown } from 'lucide-react';

interface SnapshotViewProps {
    globalIndicators: Indicator[];
    indiaIndicators: Indicator[];
    isLoading: boolean;
    insight: AIInsightV4 | null;
    loadingInsight: boolean;
    setInsight: (insight: AIInsightV4 | null) => void;
    handleGenerateInsight: (pillar: string, indicators: Indicator[]) => void;
}

export function SnapshotView({
    globalIndicators,
    indiaIndicators,
    isLoading,
    insight,
    loadingInsight,
    setInsight,
    handleGenerateInsight
}: SnapshotViewProps) {
    // ------------------------------------------------------------------------
    // RENDER HELPERS
    // ------------------------------------------------------------------------
    const filterByPillar = (indicators: Indicator[], pillarId: string) => {
        // Map conceptual pillars to indicator source/categories if needed
        // For now, we assume globalIndicators covers Pillars 1-4
        // Logic specific to Dashboard.tsx original implementation:

        switch (pillarId) {
            case 'PILLAR_1': // Global Rate & Currency
                return indicators.filter(i => ['US_10Y', 'DXY', 'FED_FUNDS', 'US_2Y', 'SPREAD_2S10S'].includes(i.id));
            case 'PILLAR_2': // Global Inflation
                return indicators.filter(i => ['BRENT_OIL', 'GOLD', 'CRB_INDEX', 'TIPS_BREAKEVEN', 'REAL_YIELD'].includes(i.id));
            case 'PILLAR_3': // Global Growth
                return indicators.filter(i => ['US_PMI', 'GLOBAL_PMI', 'CHINA_PMI', 'EU_PMI', 'COPPER'].includes(i.id));
            case 'PILLAR_4': // Risk Appetite
                return indicators.filter(i => ['VIX', 'HY_SPREAD', 'MOVE_INDEX', 'USDJPY', 'GOLD_COPPER_RATIO'].includes(i.id));
            default:
                return [];
        }
    };

    // Derived State for Pillars
    const ratesIndicators = filterByPillar(globalIndicators, 'PILLAR_1');
    const inflationIndicators = filterByPillar(globalIndicators, 'PILLAR_2');
    const growthIndicators = filterByPillar(globalIndicators, 'PILLAR_3');
    const riskIndicators = filterByPillar(globalIndicators, 'PILLAR_4');

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* AI Insight Section (If Active) */}
            {insight && (
                <div className="relative rounded-[24px] bg-white border border-gray-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 mb-8">
                    {/* Header: Regime & Confiidence */}
                    <div className="bg-[#111111] text-white p-6 flex items-start justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest">
                                    Strategic Vision
                                </span>
                                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                                    {insight.regime.timeframe} • {insight.regime.confidence} Confidence
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight mb-2">{insight.regime.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                {insight.confidence_score.drivers.map((d, i) => (
                                    <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 border border-white/5">
                                        {d}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setInsight(null)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Hero: Summary */}
                    <div className="p-8 border-b border-gray-100 bg-white">
                        <p className="text-xl text-gray-800 font-medium italic leading-relaxed">
                            "{insight.summary}"
                        </p>
                    </div>

                    {/* Core: Dominance */}
                    <div className="p-8 bg-indigo-50/50 border-b border-indigo-100/50">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="h-5 w-5 text-indigo-600" />
                            <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">The Inevitable Force</h4>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900 mb-3">{insight.dominance.signal}</h5>
                        <ul className="space-y-2">
                            {insight.dominance.reason.map((r, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Strategy Grid (4 Quadrants) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
                        {/* Winners */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#34C759]">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Relative Winners</span>
                            </div>
                            <ul className="space-y-3">
                                {insight.strategy.winners.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-800 font-medium border-l-2 border-[#34C759]/30 pl-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Losers */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#FF3B30]">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Relative Losers</span>
                            </div>
                            <ul className="space-y-3">
                                {insight.strategy.losers.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-800 font-medium border-l-2 border-[#FF3B30]/30 pl-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Crowded / Traps */}
                        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-4 text-orange-600">
                                <Info className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Crowded Trades / Traps</span>
                            </div>
                            <ul className="space-y-3">
                                {insight.strategy.crowded.map((item, i) => {
                                    const parts = item.split(/ [-–] /);
                                    const trade = parts[0];
                                    const reason = parts.slice(1).join(' – ');
                                    return (
                                        <li key={i} className="text-sm text-gray-700">
                                            {reason ? (
                                                <>
                                                    <span className="font-bold text-gray-900">{trade}</span>
                                                    <span className="text-gray-500"> – {reason}</span>
                                                </>
                                            ) : (
                                                item
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* What Breaks First */}
                        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-4 text-gray-900">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">What Breaks First</span>
                            </div>
                            <ul className="space-y-3">
                                {insight.strategy.what_breaks_first.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-900 font-semibold border-l-2 border-red-500 pl-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer: Flip Conditions */}
                    <div className="p-6 bg-gray-50 text-sm text-gray-600 border-b border-gray-200 space-y-3">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-900 shrink-0">Primary Flip:</span>
                            <span>{insight.flip_conditions.primary.join(" AND ")}</span>
                        </div>
                        {insight.flip_conditions.false_flip && (
                            <div className="flex gap-2 text-orange-700 bg-orange-50 p-2 rounded-md">
                                <span className="font-bold shrink-0">False Flip:</span>
                                <span>{insight.flip_conditions.false_flip}</span>
                            </div>
                        )}
                        {insight.flip_conditions.confirmation && (
                            <div className="flex gap-2 text-green-700 bg-green-50 p-2 rounded-md">
                                <span className="font-bold shrink-0">Confirmation Signals:</span>
                                <span>{insight.flip_conditions.confirmation}</span>
                            </div>
                        )}
                    </div>

                    {/* Collapsible Context */}
                    <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Learn Why This Matters (Context)</span>
                            <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="p-6 pt-0 space-y-4">
                            {insight.context.map((c, i) => (
                                <div key={i}>
                                    <h5 className="text-sm font-bold text-gray-900 mb-1">{c.title}</h5>
                                    <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                </div>
            )}

            {/* PILLAR SECTIONS (Full Width Bento Stack) */}
            <div className="space-y-16">
                <PillarSection
                    title="Global Rate & Currency"
                    description="The cost of money and liquidity environment."
                    icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
                    indicators={filterByPillar(globalIndicators, 'PILLAR_1')}
                    isLoading={isLoading}
                    columns={4}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    onGenerateInsight={() => handleGenerateInsight('Global Rate & Currency', ratesIndicators)}
                    isInsightLoading={loadingInsight}
                />

                <PillarSection
                    title="Global Inflation"
                    description="Raw material costs and inflation expectations."
                    icon={<AlertCircle className="h-5 w-5 text-indigo-500" />}
                    indicators={filterByPillar(globalIndicators, 'PILLAR_2')}
                    isLoading={isLoading}
                    columns={4}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    onGenerateInsight={() => handleGenerateInsight('Global Inflation', inflationIndicators)}
                    isInsightLoading={loadingInsight}
                />

                <PillarSection
                    title="Global Growth"
                    description="Economic activity and demand."
                    icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                    indicators={filterByPillar(globalIndicators, 'PILLAR_3')}
                    isLoading={isLoading}
                    columns={4}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    onGenerateInsight={() => handleGenerateInsight('Global Growth', growthIndicators)}
                    isInsightLoading={loadingInsight}
                />

                <PillarSection
                    title="Risk Appetite"
                    description="Market sentiment and stress monitors."
                    icon={<Sparkles className="h-5 w-5 text-amber-500" />}
                    indicators={filterByPillar(globalIndicators, 'PILLAR_4')}
                    isLoading={isLoading}
                    columns={4}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    onGenerateInsight={() => handleGenerateInsight('Risk Appetite', riskIndicators)}
                    isInsightLoading={loadingInsight}
                />
            </div>
        </div>
    );
}
