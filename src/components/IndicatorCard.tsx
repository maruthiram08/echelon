'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Indicator, SignalStatus } from '@/types/indicators';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndicatorCardProps {
    indicator: Indicator;
    isLoading?: boolean;
}

const statusColors: Record<SignalStatus, string> = {
    green: 'bg-[#E8FAE9] text-[#34C759]',
    yellow: 'bg-[#FFFBE6] text-[#FFCC00]',
    orange: 'bg-[#FFF5E6] text-[#FF9500]',
    red: 'bg-[#FFEBEA] text-[#FF3B30]',
};

const statusLabels: Record<SignalStatus, string> = {
    green: 'Favorable',
    yellow: 'Neutral',
    orange: 'Caution',
    red: 'Alert',
};

function formatValue(value: number | null, unit: string): string {
    if (value === null) return '—';

    if (unit === 'bps') return `${(value * 100).toFixed(0)}`;
    if (unit === '$/bbl' || unit === '$/oz') return `$${value.toFixed(2)}`;
    if (unit === '$/lb') return `$${value.toFixed(3)}`;
    if (unit === '%') return value.toFixed(2);
    if (unit === '₹') return `₹${value.toFixed(2)}`;
    if (value > 1000) return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return value.toFixed(2);
}

function ChangeIndicator({ change, changePercent }: { change?: number; changePercent?: number }) {
    if (change === undefined || changePercent === undefined) return null;

    const isPositive = change > 0;
    const isNeutral = Math.abs(change) < 0.01;
    const isNegative = change < 0;

    // Color depends on context (not strictly green=good, depends on indicator)
    // For now using simple logic: Green = Up, Red = Down
    const colorClass = isPositive ? 'text-[#34C759]' : 'text-[#FF3B30]';

    if (isNeutral) {
        return (
            <div className="flex items-center gap-1 text-gray-400 text-[11px] font-medium bg-gray-50 px-2 py-1 rounded-full">
                <Minus className="h-3 w-3" />
                <span>0.00%</span>
            </div>
        );
    }

    return (
        <div className={cn(
            'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full',
            isPositive ? 'bg-[#E8FAE9] text-[#34C759]' : 'bg-[#FFEBEA] text-[#FF3B30]'
        )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
        </div>
    );
}

export function IndicatorCard({ indicator, isLoading }: IndicatorCardProps) {
    if (isLoading) return <IndicatorCardSkeleton />;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="card-bento p-6 flex flex-col justify-between h-full group cursor-pointer relative overflow-hidden">

                        {/* Hover Accent Bar */}
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                            indicator.status === 'green' ? 'bg-[#34C759]' :
                                indicator.status === 'yellow' ? 'bg-[#FFCC00]' :
                                    indicator.status === 'orange' ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'
                        )} />

                        {/* Top Row: Name & Status Dot */}
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                                {indicator.shortName}
                            </span>
                            <div className={cn(
                                "h-2 w-2 rounded-full ring-4 ring-opacity-20",
                                indicator.status === 'green' ? 'bg-[#34C759] ring-[#34C759]' :
                                    indicator.status === 'yellow' ? 'bg-[#FFCC00] ring-[#FFCC00]' :
                                        indicator.status === 'orange' ? 'bg-[#FF9500] ring-[#FF9500]' : 'bg-[#FF3B30] ring-[#FF3B30]'
                            )} />
                        </div>

                        {/* Middle Row: Big Value */}
                        <div className="mb-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-value leading-none">
                                    {formatValue(indicator.value, indicator.unit)}
                                </span>
                                <span className="text-[14px] font-medium text-gray-400">
                                    {indicator.unit && !['$/bbl', '$/oz', '$/lb', '₹'].includes(indicator.unit) ? indicator.unit : ''}
                                </span>
                            </div>
                        </div>

                        {/* Bottom Row: Change & Badge */}
                        <div className="flex items-center justify-between mt-auto">
                            <ChangeIndicator
                                change={indicator.change}
                                changePercent={indicator.changePercent}
                            />
                            <Badge
                                variant="secondary"
                                className={cn('badge-pill border-0', statusColors[indicator.status])}
                            >
                                {statusLabels[indicator.status]}
                            </Badge>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-[16px] px-4 py-3 bg-white text-gray-900 shadow-xl border-none">
                    <div className="space-y-1">
                        <p className="font-bold text-sm">{indicator.name}</p>
                        <p className="text-xs text-gray-500">{indicator.description}</p>
                        <p className="text-[10px] text-gray-400 mt-2">Updated: {new Date(indicator.lastUpdated).toLocaleTimeString()}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function IndicatorCardSkeleton() {
    return (
        <div className="card-bento p-6 h-[160px]">
            <div className="flex justify-between mb-6">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-2 w-2 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 mb-6 rounded-lg" />
            <div className="flex justify-between mt-auto">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
        </div>
    );
}
