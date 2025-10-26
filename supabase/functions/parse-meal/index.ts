import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    console.log('Parsing meal text:', text);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI to parse natural language into meal data
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert specializing in Indian cuisine and foods. 
            Parse the user's input and extract meal information. You excel at recognizing Indian dishes like:
            - Breakfast: idli, dosa, poha, paratha, upma
            - Main meals: dal, roti, chapati, rice, biryani, curries (palak paneer, butter chicken, chole, etc.)
            - Snacks: samosa, pakora, dhokla
            - Traditional portions: "2 roti", "1 bowl dal", "1 plate biryani"
            
            For each meal identified, estimate calories and macros based on typical Indian portions.
            Return ONLY valid JSON with this structure, no markdown or explanations:
            [{"name": "Meal Name", "calories": 250, "protein": 12, "carbs": 35, "fats": 6}]
            
            Example inputs:
            - "I had 2 roti with dal" → [{"name": "Roti (2 pieces)", "calories": 200, "protein": 6, "carbs": 36, "fats": 4}, {"name": "Dal (1 bowl)", "calories": 180, "protein": 9, "carbs": 25, "fats": 5}]
            - "breakfast: idli sambar" → [{"name": "Idli (2 pieces)", "calories": 120, "protein": 4, "carbs": 24, "fats": 0.5}, {"name": "Sambar (1 cup)", "calories": 150, "protein": 7, "carbs": 22, "fats": 4}]`
          },
          {
            role: 'user',
            content: text
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_meals",
              description: "Extract meal information from natural language",
              parameters: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        calories: { type: "integer" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fats: { type: "number" }
                      },
                      required: ["name", "calories"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["meals"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_meals" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to parse meal with AI');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const parsedMeals = JSON.parse(toolCall.function.arguments);
    console.log('Parsed meals:', parsedMeals);

    return new Response(
      JSON.stringify({ meals: parsedMeals.meals }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-meal function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});