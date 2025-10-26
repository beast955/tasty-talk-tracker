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
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Get daily goals
    const { data: goals } = await supabaseClient
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!goals) throw new Error('Goals not found');

    // Get food database for recommendations
    const { data: foods } = await supabaseClient
      .from('food_database')
      .select('*');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are a nutrition expert specializing in Indian cuisine and fitness nutrition.

User Profile:
- Goal: ${profile.fitness_goal === 'lose_fat' ? 'Lose Fat' : profile.fitness_goal === 'build_muscle' ? 'Build Muscle' : 'Maintain Weight'}
- Height: ${profile.height_cm}cm
- Weight: ${profile.weight_kg}kg
- Age: ${profile.age}
- Gender: ${profile.gender}
- Activity Level: ${profile.activity_level}

Daily Nutrition Targets:
- Calories: ${goals.calorie_goal}
- Protein: ${goals.protein_goal}g
- Carbs: ${goals.carbs_goal}g
- Fats: ${goals.fats_goal}g

Create a personalized meal plan for ONE DAY with breakfast, lunch, dinner, and 2 snacks. 
Focus on Indian foods and healthy options.
Each meal should include specific portion sizes and be realistic.
The total daily nutrition should match the targets.

Return your response as a JSON object with this structure:
{
  "meals": [
    {
      "meal_type": "breakfast",
      "foods": ["2 Idli", "1 cup Sambar", "1 tsp Coconut Chutney"],
      "calories": 250,
      "protein": 10,
      "carbs": 45,
      "fats": 3,
      "timing": "7:00 AM"
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "total_nutrition": {
    "calories": ${goals.calorie_goal},
    "protein": ${goals.protein_goal},
    "carbs": ${goals.carbs_goal},
    "fats": ${goals.fats_goal}
  }
}`;

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
            content: 'You are a nutrition expert. Return ONLY valid JSON, no markdown or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
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

      throw new Error('Failed to generate meal plan');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    let mealPlanText = data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    mealPlanText = mealPlanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const mealPlan = JSON.parse(mealPlanText);

    // Save meal plan
    await supabaseClient.from('meal_plans').insert({
      user_id: user.id,
      plan_type: profile.fitness_goal,
      plan_data: mealPlan
    });

    return new Response(
      JSON.stringify({ meal_plan: mealPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-meal-plan function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
