import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, UtensilsCrossed, Clock } from "lucide-react";
import { toast } from "sonner";

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  meal_time: string | null;
  created_at: string;
}

interface MealListProps {
  onMealDeleted: () => void;
}

export const MealList = ({ onMealDeleted }: MealListProps) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Meal deleted");
      fetchMeals();
      onMealDeleted();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading meals...</div>;
  }

  if (meals.length === 0) {
    return (
      <Card className="p-12 text-center card-glass">
        <UtensilsCrossed className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No meals logged yet. Start tracking!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <Card key={meal.id} className="p-6 card-glass hover-lift">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{meal.name}</h3>
                {meal.meal_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {meal.meal_time}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {meal.calories} cal
                </span>
                {meal.protein !== null && (
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent">
                    P: {meal.protein}g
                  </span>
                )}
                {meal.carbs !== null && (
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary">
                    C: {meal.carbs}g
                  </span>
                )}
                {meal.fats !== null && (
                  <span className="px-3 py-1 rounded-full bg-warning/10 text-warning">
                    F: {meal.fats}g
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(meal.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={() => handleDelete(meal.id)}
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};