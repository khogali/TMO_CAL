
import { GoogleGenAI, Chat } from "@google/genai";
import { PlanPricingData, Promotion, SavedLead } from '../types';

export async function* streamCoachingResponse(
    history: { role: string, parts: { text: string }[] }[],
    newMessage: string,
    context: {
        metrics: {
            winRate: string;
            totalLeads: number;
            openLeads: number;
            recentActivity: string;
        };
        staleLeads: { name: string; status: string; daysInactive: number }[];
        isRoleplayMode: boolean;
        roleplayPersona?: string; 
        focusLead?: SavedLead;
        promotions?: Promotion[];
        plans?: PlanPricingData;
    }
): AsyncGenerator<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Inject active context for precise advice
    const activePromos = (context.promotions || [])
        .filter(p => p.isActive)
        .map(p => `- ${p.name}: ${p.description}`)
        .join('\n');
    
    const activePlans = (context.plans || [])
        .map(p => `- ${p.name} ($${p.tieredPrices?.[0] || 'varies'}): ${p.features?.slice(0,2).join(', ')}`)
        .join('\n');

    let systemInstruction = "";

    if (context.isRoleplayMode) {
        const persona = context.roleplayPersona || "Skeptical Customer";
        
        let personaDescription = "";
        switch (persona) {
            case "Verizon Loyalist":
                personaDescription = "You love Verizon's coverage. You think T-Mobile drops calls. You are very stubborn about network reliability.";
                break;
            case "The 'Bill Shock' Customer":
                personaDescription = "You are extremely price sensitive. You freak out at the first price mentioned. You constantly compare it to your current bill of $100.";
                break;
            case "The 'Just Looking' Upgrader":
                personaDescription = "You have an iPhone 11. You want the 15 Pro, but you REFUSE to change your old grandfathered plan. You think new plans are a scam.";
                break;
            default:
                personaDescription = "You are currently with a competitor. You are price-conscious but value network quality. Challenge the sales rep.";
                break;
        }

        systemInstruction = `
            **MODE: ROLEPLAY SIMULATION**
            You are currently acting as: **${persona}** in a T-Mobile store.
            
            **YOUR PERSONA DETAILS:**
            ${personaDescription}
            
            **INSTRUCTIONS:**
            1.  Stay in character. Do not break the fourth wall unless the user asks for a grade/feedback.
            2.  Keep responses short (1-2 sentences), like a real conversation.
            3.  If the rep gives a good answer, concede the point slightly but raise another minor concern.
            4.  If the rep gives a great closing argument, agree to the sale.
            5.  **GRADING:** If the user asks "How did I do?" or "Grade me", break character and provide a score (0-100) and 3 specific bullet points on what they did well and what they missed.
        `;
    } else {
        // --- DEAL DOCTOR LOGIC ---
        let leadSpecifics = "";
        if (context.focusLead) {
            const l = context.focusLead;
            const q = l.versions?.[l.versions.length - 1]?.quoteConfig;
            
            if (q) {
                const deviceNames = q.devices.map(d => d.modelId || 'Device').join(', ');
                const hasInsurance = q.devices.some(d => d.insuranceId);
                
                leadSpecifics = `
                **CURRENT FOCUS LEAD ANALYSIS:**
                - Customer: ${l.customerName} (${l.status})
                - Plan: ${q.plan} with ${q.lines} lines.
                - Devices: ${deviceNames}
                - Insurance Attached: ${hasInsurance ? 'Yes' : 'No'}
                - Notes: ${l.notes}
                
                **YOUR TASK FOR THIS LEAD:**
                Analyze the configuration above against the **Active Promotions** list below.
                Identify ONE major "Gap" (e.g. no insurance on expensive phones, old plan missing trade-in value, missed BOGO deal) and suggest ONE specific "Hook" or script to close them.
                `;
            }
        }

        const staleLeadsText = context.staleLeads.length > 0 
            ? context.staleLeads.map(l => `- ${l.name} (${l.status}): Inactive for ${l.daysInactive} days`).join('\n')
            : "No stale leads detected.";

        systemInstruction = `
            You are an expert Sales Coach for T-Mobile. Your goal is to motivate the sales representative and provide actionable advice to help them close more deals.
            
            **USER METRICS:**
            - Win Rate: ${context.metrics.winRate}
            - Total Leads Managed: ${context.metrics.totalLeads}
            - Currently Open Leads: ${context.metrics.openLeads}
            
            **ACTIVE PROMOTIONS (Use these to find opportunities):**
            ${activePromos}

            **AVAILABLE PLANS:**
            ${activePlans}
            
            **PIPELINE HEALTH:**
            ${staleLeadsText}

            ${leadSpecifics}

            **INSTRUCTIONS:**
            1.  **Analyze & Prescribe:** If a specific lead is provided above, focus ONLY on that lead. Use the "thinking" process to match the lead's current config against the Active Promotions list to find missing value.
            2.  **Be Encouraging but Direct:** Celebrate wins, but give constructive feedback.
            3.  **T-Mobile Specifics:** Emphasize T-Mobile value propositions (Coverage, Price Lock, Carrier Freedom/Keep & Switch) when relevant.
            4.  **Battle Cards:** If the user asks for a script for a specific objection (Price, Coverage, etc.), provide 3 short, punchy bullet points they can say *immediately*.
            5.  **Concise:** Keep responses punchy and easy to read.
        `;
    }

    // Use Gemini 3 Pro with Thinking for deep coaching analysis
    const chat: Chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { 
            systemInstruction,
            thinkingConfig: { thinkingBudget: 32768 } // Max thinking for deep strategy analysis
        },
        history
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
}
