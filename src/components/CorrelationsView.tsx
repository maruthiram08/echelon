import React, { useEffect, useState } from 'react';
import { Indicator } from '@/types/indicators';
import { RegimeMatrix } from '@/components/charts/RegimeMatrix';
import { DualAxisChart } from '@/components/charts/DualAxisChart';
import { RefreshCw, TrendingUp, Activity, BrainCircuit, Sparkles, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrelationsViewProps {
    globalIndicators: Indicator[];
    indiaIndicators: Indicator[];
}

interface CorrelationData {
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

interface InsightDetail {
    signal_status: 'DOMINANT' | 'ACTIVE' | 'DORMANT' | 'CONTRADICTED';
    relationship_state: string;
    dominant_driver: string;
    market_consequence: string;
    invalidation: string;
    confidence_context?: string;
}

interface AnalysisResult {
    summary_pro: string;
    summary_simple: string;
    insights: Record<string, InsightDetail>;
}

const PILLARS = ['All', 'Rates', 'Inflation', 'Growth', 'Risk'];

export function CorrelationsView({
    globalIndicators,
    indiaIndicators
}: CorrelationsViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [data, setData] = useState<{
        correlations: CorrelationData[];
        regime_matrix: RegimePoint[];
    } | null>(null);
    const [activePillar, setActivePillar] = useState('All');

    // View Mode State: 'simple' | 'standard' | 'pro'
    // For V5, Standard and Pro are identical in content per user request 
    // ("Standard Layer (What you mostly have now) ... Pro Layer (Your existing institutional language)").
    // So 'Standard' == 'Pro' in this implementation for now, unless further differentiation needed.
    // We will treat 'simple' as distinct, and 'standard'/'pro' as the "Institutional" view.
    const [viewMode, setViewMode] = useState<'simple' | 'standard' | 'pro'>('standard');

    useEffect(() => {
        async function loadCorrelations() {
            try {
                const res = await fetch('/api/analysis/correlations', { method: 'POST' });
                const result = await res.json();
                if (result.success) {
                    setData(result);
                }
            } catch (e) {
                console.error('Failed to load correlations', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadCorrelations();
    }, []);

    const handleGenerateInsights = async () => {
        if (!data) return;
        setIsAnalyzing(true);
        try {
            // Include TREND in the payload
            const simplifiedCorrelations = data.correlations.map(c => ({
                id: c.id,
                name: c.name,
                correlation: c.correlation,
                trend: c.trend,
                pillar: c.pillar
            }));
            const regime = data.regime_matrix[data.regime_matrix.length - 1];

            const res = await fetch('/api/analysis/correlations/insight', {
                method: 'POST',
                body: JSON.stringify({ correlations: simplifiedCorrelations, regime })
            });
            const result = await res.json();

            // Safety check if result is valid
            if (result && result.insights) {
                setAnalysis(result);
            } else {
                console.error("Invalid AI response structure", result);
            }
        } catch (e) {
            console.error('Insight generation failed', e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const filteredCorrelations = data?.correlations.filter(c =>
        activePillar === 'All' || c.pillar === activePillar
    );

    const isSimple = viewMode === 'simple';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">

            {/* VIEW MODE TOGGLE (Global) */}
            <div className="flex justify-center -mb-4 sticky top-4 z-50">
                <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-full p-1 border border-gray-200 flex items-center gap-1">
                    {(['simple', 'standard', 'pro'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize",
                                viewMode === mode
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Header */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between">
                <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6 md:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-50 text-orange-600 p-2.5 rounded-full">
                            <Activity className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">The Macro "Golden Set"</h2>
                    </div>
                    <p className="text-gray-500 max-w-xl">
                        {isSimple
                            ? "Key relationships that tell us if it's safe to invest right now."
                            : "Institutional-grade correlations determining the current regime. Updated daily from Global & flows data."}
                    </p>
                </div>

                <button
                    onClick={handleGenerateInsights}
                    disabled={isAnalyzing || isLoading}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95",
                        isAnalyzing ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-indigo-200"
                    )}
                >
                    {isAnalyzing ? (
                        <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Analyzing Matrix...
                        </>
                    ) : (
                        <>
                            <BrainCircuit className="h-5 w-5" />
                            Generate AI Commentary
                        </>
                    )}
                </button>
            </div>

            {/* AI Summary Section */}
            {analysis && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-[24px] p-6 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-2 rounded-full shadow-sm text-violet-600 mt-1">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {isSimple ? "What You Need to Know" : "Strategist's Summary"}
                            </h3>
                            <p className="text-gray-700 leading-relaxed font-medium">
                                {/* Use Simple Summary if in Simple Mode, else Pro */}
                                {isSimple && analysis.summary_simple ? analysis.summary_simple : analysis.summary_pro}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="h-96 bg-gray-50 rounded-[24px] border border-gray-200 animate-pulse flex items-center justify-center">
                    <span className="text-gray-400 font-medium">Computing Global Matrix (Phase 8 Engine)...</span>
                </div>
            ) : data ? (
                <>
                    {/* 1. HERO CHART: Regime Matrix */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 1a. Regime Compass */}
                        <div className="lg:col-span-1 bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm h-[500px] flex flex-col">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Regime Compass
                                </h3>
                                <p className="text-xs text-gray-500 italic mt-1">
                                    {isSimple
                                        ? "Are markets calm or stressed?"
                                        : "Global Liquidity vs Systemic Stress. Where are we?"}
                                </p>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <RegimeMatrix data={data.regime_matrix} />
                            </div>

                            {/* Regime Interpretation (Progressive) */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Interpretation</h4>
                                {isSimple ? (
                                    <p className="text-sm text-gray-600 font-medium">
                                        Markets are stressed. Gains tend to be uneven in this zone. Prioritize safety over aggressive growth.
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Current positioning reflects tightening global liquidity with elevated systemic stress.
                                        Risk-taking remains possible but fragile; positioning should prioritize liquidity resilience.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 1b. Critical Disconnects */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-[#111] to-[#222] rounded-[24px] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Critical Disconnects (Current)</h3>

                                {/* ELITE VERDICT (Progressive) */}
                                <div className="mb-6 p-3 bg-white/10 rounded-lg border border-white/20">
                                    <span className="text-orange-300 font-bold text-sm tracking-wide uppercase mr-2">Verdict:</span>
                                    <span className="text-gray-200 text-sm italic">
                                        {isSimple
                                            ? "Market prices don't match the stress we see in the system. Be careful."
                                            : "Markets are selectively pricing growth and inflation signals while underestimating the persistence of USD-driven liquidity constraints."
                                        }
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {data.correlations
                                        .filter(c => Math.abs(c.correlation) > 0.5)
                                        .slice(0, 4)
                                        .map(c => (
                                            <div key={c.id} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 transition-all hover:bg-white/15">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-sm text-gray-200">{c.name}</span>
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-0.5 rounded",
                                                        c.correlation > 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                                                    )}>
                                                        {c.correlation.toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                                    {c.description}
                                                </p>
                                                {/* Trend indicator */}
                                                <div className="flex items-center gap-1">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        c.trend === 'Strengthening' ? "bg-green-400" : c.trend === 'Weakening' ? "bg-red-400" : "bg-gray-400"
                                                    )} />
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{c.trend}</span>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* LIKELY RESOLUTION PATH (Standard/Pro Only) */}
                            {!isSimple && (
                                <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Likely Resolution Path</h4>
                                    <ul className="space-y-1 text-sm text-gray-300">
                                        <li className="flex items-center gap-2">
                                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                            Risk assets reprice lower to align with liquidity conditions, or
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <TrendingUp className="h-3 w-3 text-green-500" />
                                            Liquidity constraints ease materially.
                                        </li>
                                    </ul>
                                </div>
                            )}

                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* 3. PILLAR FILTER */}
                    <div className="flex flex-wrap justify-center gap-2 my-8">
                        {PILLARS.map(p => (
                            <button
                                key={p}
                                onClick={() => setActivePillar(p)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    activePillar === p
                                        ? "bg-slate-900 text-white shadow-lg"
                                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* 4. CORRELATION GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCorrelations?.map((corr) => {
                            const insight = analysis?.insights[corr.name];

                            return (
                                <div key={corr.id} className="bg-white rounded-[20px] p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                corr.pillar === 'Rates' && "bg-blue-500",
                                                corr.pillar === 'Inflation' && "bg-red-500",
                                                corr.pillar === 'Growth' && "bg-green-500",
                                                corr.pillar === 'Risk' && "bg-orange-500"
                                            )} />
                                            <div className="flex flex-col">
                                                <h4 className="font-bold text-gray-900 text-sm truncate max-w-[180px]" title={corr.name}>{corr.name}</h4>
                                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter font-semibold">{corr.trend}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-gray-500">
                                            R: {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="h-[200px] w-full mb-3 shrink-0">
                                        <DualAxisChart
                                            data={corr.series}
                                            label1={corr.name.split(' vs ')[0]}
                                            label2={corr.name.split(' vs ')[1]}
                                        />
                                    </div>

                                    <div className="mt-auto">
                                        <p className="text-[11px] text-gray-500 leading-tight mb-3">
                                            {corr.description}
                                        </p>

                                        {/* AI Commentary Overlay - HIDDEN FOR BEGINNERS AS PER PLAN ("Do NOT need beginner layer: Individual correlation cards... Let beginners graduate") */}
                                        {/* Wait, user said "Beginners never see Layer 3 first". User implies beginners SHOULD see something, or nothing? */}
                                        {/* "Do NOT need beginner layer: ... Signal status labels ... Let beginners graduate into those." */}
                                        {/* So for Simple mode, do we hide this card entirely? Or show it? */}
                                        {/* "Advanced users never see Layer 1 ... Beginners never see Layer 3" */}
                                        {/* User explicitly listed "Do NOT need beginner layer: Individual correlation cards". */}
                                        {/* This implies we should either show NOTHING or show the box but standard text? */}
                                        {/* Actually, simplifying the box is dangerous. Better to HIDE the box in Simple mode? */}
                                        {/* Logic: If simple mode, maybe just hide the "Strategic Insight" box? */}
                                        {/* "Let beginners graduate into those" suggests they should not see them in Simple mode. */}

                                        {!isSimple && insight && (
                                            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-3 mt-2 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <BrainCircuit className="h-3.5 w-3.5 text-violet-600" />
                                                        <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Strategic Insight</span>
                                                    </div>
                                                    {/* Signal Status Badge */}
                                                    <span className={cn(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                                                        insight.signal_status === 'DOMINANT' && "bg-purple-100 text-purple-700 border-purple-200",
                                                        insight.signal_status === 'ACTIVE' && "bg-green-100 text-green-700 border-green-200",
                                                        insight.signal_status === 'DORMANT' && "bg-gray-100 text-gray-500 border-gray-200",
                                                        insight.signal_status === 'CONTRADICTED' && "bg-red-100 text-red-700 border-red-200",
                                                    )}>
                                                        {insight.signal_status}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">State</span>
                                                        <p className="text-[11px] font-medium text-gray-800 leading-snug">{insight.relationship_state}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold text-violet-400 block mb-0.5">Dominant Driver</span>
                                                        <p className="text-[11px] font-medium text-violet-900 leading-snug">{insight.dominant_driver}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                                        <div>
                                                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Consequence</span>
                                                            <p className="text-[10px] text-gray-600 leading-tight">{insight.market_consequence}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] uppercase font-bold text-red-400 block">Invalidation</span>
                                                            <p className="text-[10px] text-gray-500 italic leading-tight">{insight.invalidation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* If simple mode, maybe show a "Pro Feature" placeholder or just nothing? 
                                            User said "Do not need beginner layers... Let beginners graduate". 
                                            I'll hide the complex box for Simple mode to reduce cognitive load. 
                                        */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500">Failed to load correlation data.</p>
                </div>
            )}
        </div>
    );
}
