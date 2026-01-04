'use client';

import React from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface DataPoint {
    date: string;
    x: number; // Metric 1 (Left Axis)
    y: number; // Metric 2 (Right Axis)
}

interface DualAxisChartProps {
    data: DataPoint[];
    label1: string;
    label2: string;
}

export function DualAxisChart({ data, label1, label2 }: DualAxisChartProps) {
    if (!data || data.length === 0) return <div>No Data</div>;

    // Formatting date (e.g., '2023-01-01' -> 'Jan')
    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10, fill: '#666' }}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                />

                {/* Left Axis */}
                <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 10, fill: '#8884d8' }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    width={40}
                />

                {/* Right Axis */}
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#82ca9d' }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    width={40}
                />

                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#333' }}
                />
                <Legend iconType="circle" />

                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="x"
                    name={label1}
                    stroke="#8884d8"
                    dot={false}
                    strokeWidth={2}
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="y"
                    name={label2}
                    stroke="#82ca9d"
                    dot={false}
                    strokeWidth={2}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
