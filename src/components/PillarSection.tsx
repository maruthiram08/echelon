import React from 'react';
import { Indicator } from '@/types/indicators';
import { IndicatorCard, IndicatorCardSkeleton } from '@/components/IndicatorCard';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface PillarSectionProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    indicators: Indicator[];
    isLoading?: boolean;
    columns?: number;
    gridClassName?: string;
    onGenerateInsight?: () => void;
    isInsightLoading?: boolean;
    disableInsight?: boolean;
}

export default function PillarSection({
    title,
    description,
    icon,
    indicators,
    isLoading,
    columns = 5,
    gridClassName,
    onGenerateInsight,
    isInsightLoading = false,
    disableInsight = false
}: PillarSectionProps) {
    // Bento Grid Layout: Auto-fill with min width 200px
    const defaultGrid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6';

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 ml-2">
                    <div className="p-3 rounded-full bg-white shadow-sm ring-1 ring-black/5 text-[#E06D4E]">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                        <p className="text-sm text-gray-500 font-medium">{description}</p>
                    </div>
                </div>

                {onGenerateInsight && (
                    <button
                        onClick={onGenerateInsight}
                        disabled={isInsightLoading || disableInsight}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm border",
                            isInsightLoading
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                                : "bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200"
                        )}
                    >
                        <Sparkles className={cn("h-4 w-4", isInsightLoading && "animate-spin")} />
                        {isInsightLoading ? 'Analyzing...' : 'AI Insight'}
                    </button>
                )}
            </div>

            <div className={cn(defaultGrid, gridClassName)}>
                {isLoading ? (
                    Array(columns).fill(0).map((_, i) => <IndicatorCardSkeleton key={i} />)
                ) : indicators.length > 0 ? (
                    indicators.map(indicator => (
                        <div key={indicator.id} className="h-full">
                            <IndicatorCard indicator={indicator} />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
                        <p className="text-gray-400">No data available for this section</p>
                    </div>
                )}
            </div>
        </section>
    );
}
