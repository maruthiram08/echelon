import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const { correlations, regime } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                {
                    summary_pro: "AI Configuration missing. Please check API Key.",
                    summary_simple: "AI is offline.",
                    insights: {}
                },
                { status: 200 }
            );
        }

        // Instantiate OpenAI client inside handler (not at module level) for build compatibility
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Format correlations for the Prompt
        const correlationContext = correlations.map((c: any) =>
            `\n---\nCorrelation Name: ${c.name}\nIndicators: ${c.name}\nCorrelation Value (R): ${c.correlation.toFixed(2)}\nCorrelation Trend: ${c.trend || 'Stable'}\nMacro Regime: ${regime.regime}`
        ).join('\n');

        const regimeText = `Global Liquidity Score: ${regime.liquidity_score.toFixed(2)}, India Stress Score: ${regime.stress_score.toFixed(2)} (Regime: ${regime.regime})`;

        const prompt = `
        You are a senior global macro strategist writing institutional-grade market insights.
        Your goal is to provide a "Daily Macro Call" with high conviction.

        You are given:
        1) Two macro indicators and their correlation
        2) The current correlation value (R)
        3) Whether the correlation is strengthening or weakening vs the prior period (Trend)
        4) The current macro regime

        Your task:
        Generate insights for EACH correlation, PLUS two versions of a high-level summary.

        IMPORTANT EDITORIAL RULES (NON-NEGOTIABLE):
        1. **STASIS INTERPRETATION**: If the trend is "Stable", do NOT just say it is stable. Explain WHY (e.g. "priced in").
        2. **REGIME-AWARE INVALIDATION**: Invalidation must reference the MACRO REGIME.
        3. **CONVICTION LANGUAGE**: Use "confirms", "reinforces", "fails to support". Ban "suggests".
        4. **DELTA LENS**: For every insight, answer: Is this strengthening? Is it weakening? Is it persistently dominant?
        
        -------------------------------------------------------------
        **INPUT DATA**:
        Current Regime: ${regimeText}

        Correlations to Analyze:
        ${correlationContext}

        -------------------------------------------------------------
        **OUTPUT FORMAT (Strict JSON)**:
        Returns a JSON object with:
        
        {
            "insights": {
                "US 10Y vs DXY": {
                    "signal_status": "DOMINANT" | "ACTIVE" | "DORMANT" | "CONTRADICTED",
                    "relationship_state": "...",
                    "dominant_driver": "...",
                    "market_consequence": "...",
                    "invalidation": "...",
                    "confidence_context": "..."
                }
            },
            "summary_pro": "The institutional strategist summary (existing rules). Name binding constraints. 'Despite mixed growth signals, USD-linked liquidity constraints remain the binding force...'",
            "summary_simple": "Beginner translation. Max 3 sentences. No jargon. Focus on behavior (e.g., 'Markets are showing signs of stress... gains tend to be uneven...')."
        }

        **SIGNAL STATUS DEFINITIONS**:
        - **DOMINANT**: High correlation (>0.7), Strengthening or Persistent. Driving the regime.
        - **ACTIVE**: Moderate correlation, aligned with regime.
        - **DORMANT**: Low correlation or flattened trend. Not driving delta.
        - **CONTRADICTED**: Correlation exists but opposes the broader regime logic.
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const raw = completion.choices[0].message.content;
        const parsed = raw ? JSON.parse(raw) : { summary_pro: "Failed", summary_simple: "Failed", insights: {} };

        const summary_pro = parsed.summary_pro || "No summary generated.";
        const summary_simple = parsed.summary_simple || "No summary generated.";

        // Ensure structure
        const insights = parsed.insights || {};
        // Fallback if older structure was hallucinated
        if (Object.keys(insights).length === 0) {
            Object.keys(parsed).forEach(key => {
                if (key !== 'summary_pro' && key !== 'summary_simple' && key !== 'summary' && key !== 'insights') {
                    insights[key] = parsed[key];
                }
            });
        }

        return NextResponse.json({ summary_pro, summary_simple, insights });

    } catch (error: any) {
        console.error('Correlation Insight Error:', error);
        return NextResponse.json(
            {
                summary_pro: `Failed to generate analysis. Error: ${error.message || 'Unknown'}`,
                summary_simple: "Error generating insight.",
                insights: {}
            },
            { status: 500 }
        );
    }
}
