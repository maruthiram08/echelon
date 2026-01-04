import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define minimal Indicator interface locally to avoid circular dependencies if types are tricky
// or import from types/indicators
import { Indicator } from '@/types/indicators';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { pillar, indicators } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { analysis: "**Configuration Error**: OpenAI API Key is missing. Please add it to .env.local." },
                { status: 200 } // Return 200 to display error gracefully in UI
            );
        }

        const indicatorSummary = indicators.map((ind: Indicator) =>
            `- ${ind.name}: ${ind.value !== null ? ind.value : 'N/A'} ${ind.unit} [Signal: ${ind.status.toUpperCase()}]`
        ).join('\n');

        const prompt = `
        You are an Institutional Global Macro Strategist (Elite Tier). 
        
        Analyze the following indicators for the **"${pillar}"** category:
        ${indicatorSummary}

        -------------------------------------------------------------
        **OBJECTIVE: V5 ELITE POLISH**
        Your goal is "credibility". Be precise, hierarchical, and causal.
        
        Return the result **STRICTLY as a valid JSON object**:

        {
            "regime": {
                "name": "string (Opinionated: e.g. 'Late-Cycle Liquidity Tightening')",
                "confidence": "High | Medium | Low",
                "timeframe": "string (1-3 months)"
            },
            "confidence_score": {
                "drivers": ["string (Specific data points: e.g. 'DXY > 95th percentile')"]
            },
            "summary": "string (CONDITIONAL: e.g. 'Until USD strength breaks, defensives outperform while risk is capped.')",
            "context": [
                {
                    "title": "Indicator Name",
                    "content": "Why today is unusual. Compare to history."
                }
            ],
            "dominance": {
                "signal": "string (The Inevitable Force)",
                "reason": ["string", "string"]
            },
            "strategy": {
                "winners": ["string (Relative: e.g. 'US Large Cap Defensives vs EM')"],
                "losers": ["string (Relative: e.g. 'EM External-Funding Markets')"],
                "crowded": ["string (Format: 'Trade Name - Causal Reason linking to Dominant Force (e.g. Liquidity)')"],
                "what_breaks_first": ["string (Specific vulnerability: e.g. 'High Beta Credit')"]
            },
            "flip_conditions": {
                "primary": ["string (Primary Flip: e.g. DXY < 110 AND US 10Y < 3.75%)"],
                "false_flip": "string (Warning: Yield steepening WITHOUT USD weakening)",
                "confirmation": "string (Clean text: e.g. 'EM FX stabilization + FII inflows')"
            }
        }

        **LOGIC RULES:**
        1. **conditional Summary**: Must follow "Until X, then Y" or "While X, Y happens". No generic advice.
        2. **Hierarchy**: In 'dominance', explicit state if one signal overrides another (e.g. "USD overrides Yields").
        3. **Causality**: Crowded trades must explain WHY based on the regime (e.g. "Valuations ignore liquidity").
        4. **Tone**: Institutional, decisive, concise.
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const analysisRaw = completion.choices[0].message.content;
        const analysis = analysisRaw ? JSON.parse(analysisRaw) : null;

        return NextResponse.json({ analysis });

    } catch (error) {
        console.error('AI Insight Error:', error);
        return NextResponse.json(
            { analysis: "**Error**: Failed to generate insight. Please try again later." },
            { status: 500 }
        );
    }
}
