'use client';

import React from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Label,
    Cell
} from 'recharts';

interface RegimePoint {
    date: string;
    liquidity_score: number;
    stress_score: number;
    regime: string;
}

interface RegimeMatrixProps {
    data: RegimePoint[];
}

export function RegimeMatrix({ data }: RegimeMatrixProps) {
    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-gray-900">{d.date}</p>
                    <p className="text-gray-600">Liquidity: <span className="font-mono font-bold">{d.liquidity_score.toFixed(2)}</span></p>
                    <p className="text-gray-600">Stress: <span className="font-mono font-bold">{d.stress_score.toFixed(2)}</span></p>
                    <p className={`mt-1 font-bold ${d.regime === 'RISK_ON' ? 'text-green-600' :
                        d.regime === 'CRISIS' ? 'text-red-600' : 'text-gray-600'
                        }`}>{d.regime}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                {/* 
                   Liquidity Score (X): 
                   Spec says: Low Score (-1) is Risk On. High Score (+1) is Tight.
                   So Left side = Risk On. Right side = Tight.
                 */}
                <XAxis
                    type="number"
                    dataKey="liquidity_score"
                    name="Liquidity"
                    domain={[-3, 3]}
                    label={{ value: 'Global Liquidity Constraint (Lower is Better)', position: 'bottom', offset: 0, fontSize: 12, fill: '#666' }}
                />

                {/* 
                   Stress Score (Y): 
                   Spec says: Low Score is Calm. High Score is Panic.
                   So Bottom = Calm. Top = Panic.
                 */}
                <YAxis
                    type="number"
                    dataKey="stress_score"
                    name="Stress"
                    domain={[-3, 3]}
                    label={{ value: 'Systemic Stress (Higher is Worse)', angle: -90, position: 'left', offset: 0, fontSize: 12, fill: '#666' }}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Axes Lines */}
                <ReferenceLine x={0} stroke="#000" strokeOpacity={0.2} />
                <ReferenceLine y={0} stroke="#000" strokeOpacity={0.2} />

                {/* Quadrant Labels */}
                {/* Bottom Left: Liquid & Calm -> GOLDILOCKS */}
                <ReferenceLine x={-1.5} stroke="none" label={{ value: "GOLDILOCKS", position: 'insideBottom', fill: '#34C759', fontSize: 14, fontWeight: 'bold', opacity: 0.3 }} />

                {/* Top Right: Tight & Stress -> CRISIS */}
                <ReferenceLine x={1.5} stroke="none" label={{ value: "CRISIS / BTFD?", position: 'insideTop', fill: '#FF3B30', fontSize: 14, fontWeight: 'bold', opacity: 0.3 }} />

                {/* Top Left: Liquid but Stress -> FEAR/SHOCK */}
                {/* Bottom Right: Tight but Calm -> DEFENSIVE/GRIND */}

                <Scatter name="Regime" data={data} fill="#8884d8">
                    {data.map((entry, index) => {
                        // Color logic
                        let color = '#999';
                        if (entry.regime === 'RISK_ON') color = '#34C759'; // Green
                        else if (entry.regime === 'CRISIS') color = '#FF3B30'; // Red
                        else if (entry.regime === 'DEFENSIVE') color = '#FF9500'; // Orange
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                </Scatter>
            </ScatterChart>
        </ResponsiveContainer>
    );
}
