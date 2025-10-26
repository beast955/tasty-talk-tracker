import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface NLPInputProps {
  onMealsAdded: () => void;
}

export const NLPInput = ({ onMealsAdded }: NLPInputProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error("Please enter a meal description");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-meal', {
        body: { text }
      });

      if (error) throw error;

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      // Insert parsed meals into database
      const mealsToInsert = data.meals.map((meal: any) => ({
        user_id: user.data.user.id,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fats: meal.fats || 0,
        meal_time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));

      const { error: insertError } = await supabase
        .from('meals')
        .insert(mealsToInsert);

      if (insertError) throw insertError;

      toast.success(`Added ${data.meals.length} meal(s)!`);
      setText("");
      onMealsAdded();
    } catch (error: any) {
      console.error('Error parsing meal:', error);
      toast.error(error.message || "Failed to parse meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 card-glass hover-lift">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">AI Meal Parser</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe what you ate naturally, like "2 eggs and whole wheat toast" or "chicken caesar salad with dressing"
        </p>
        <Textarea
          placeholder="I ate 2 scrambled eggs, whole wheat toast with butter, and orange juice..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[100px] border-border/50 focus:border-primary transition-colors resize-none"
        />
        <Button
          onClick={handleParse}
          disabled={loading}
          className="w-full btn-gradient-secondary"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Parse with AI
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};