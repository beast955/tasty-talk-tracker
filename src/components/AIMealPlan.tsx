import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Flame, Drumstick, Wheat } from "lucide-react";
import { toast } from "sonner";

interface Meal {
  meal_type: string;
  foods: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timing: string;
}

interface MealPlan {
  meals: Meal[];
  tips: string[];
  total_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export const AIMealPlan = () => {
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);

  const generateMealPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-meal-plan');

      if (error) throw error;

      setMealPlan(data.meal_plan);
      toast.success("AI meal plan generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate meal plan");
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Meal Plan Generator
        </CardTitle>
        <CardDescription>
          Get a personalized daily meal plan based on your goals and nutrition targets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!mealPlan ? (
          <div className="text-center py-8">
            <div className="mb-6 text-6xl animate-float">🤖</div>
            <p className="text-muted-foreground mb-6">
              Let AI create a customized meal plan with Indian foods tailored to your fitness goals
            </p>
            <Button
              onClick={generateMealPlan}
              disabled={loading}
              className="btn-gradient-primary"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Meal Plan
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <Flame className="w-5 h-5 text-warning mb-2" />
                <p className="text-2xl font-bold">{mealPlan.total_nutrition.calories}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="stat-card">
                <Drumstick className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold">{mealPlan.total_nutrition.protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="stat-card">
                <Wheat className="w-5 h-5 text-secondary mb-2" />
                <p className="text-2xl font-bold">{mealPlan.total_nutrition.carbs}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="stat-card">
                <div className="w-5 h-5 text-accent mb-2">🥑</div>
                <p className="text-2xl font-bold">{mealPlan.total_nutrition.fats}g</p>
                <p className="text-xs text-muted-foreground">Fats</p>
              </div>
            </div>

            <div className="space-y-4">
              {mealPlan.meals.map((meal, index) => (
                <Card key={index} className="hover-lift border border-border/50 hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMealIcon(meal.meal_type)}</span>
                        <div>
                          <h4 className="font-semibold capitalize">{meal.meal_type}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {meal.timing}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {meal.calories} cal
                      </Badge>
                    </div>

                    <ul className="space-y-1 mb-3">
                      {meal.foods.map((food, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          {food}
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-4 text-xs">
                      <span>P: <strong>{meal.protein}g</strong></span>
                      <span>C: <strong>{meal.carbs}g</strong></span>
                      <span>F: <strong>{meal.fats}g</strong></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {mealPlan.tips.length > 0 && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Pro Tips
                  </h4>
                  <ul className="space-y-2">
                    {mealPlan.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={generateMealPlan}
              variant="outline"
              className="w-full border-border/50 hover:border-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
