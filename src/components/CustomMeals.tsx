import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, BookPlus } from "lucide-react";

interface CustomMeal {
  id: string;
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

interface CustomMealsProps {
  onMealAdded: () => void;
}

export const CustomMeals = ({ onMealAdded }: CustomMealsProps) => {
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  useEffect(() => {
    fetchCustomMeals();
  }, []);

  const fetchCustomMeals = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
        .from('custom_meals')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomMeals(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveCustomMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { error } = await supabase.from('custom_meals').insert({
        user_id: user.data.user.id,
        name,
        calories: parseInt(calories),
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
      });

      if (error) throw error;

      toast.success("Custom meal saved!");
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setShowForm(false);
      fetchCustomMeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUseCustomMeal = async (meal: CustomMeal) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { error } = await supabase.from('meals').insert({
        user_id: user.data.user.id,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        meal_time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });

      if (error) throw error;

      toast.success("Meal added to today!");
      onMealAdded();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCustomMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_meals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Custom meal deleted");
      fetchCustomMeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full btn-gradient-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Meal
        </Button>
      )}

      {showForm && (
        <Card className="p-6 card-glass hover-lift">
          <h3 className="font-semibold text-lg mb-4">New Custom Meal</h3>
          <form onSubmit={handleSaveCustomMeal} className="space-y-4">
            <Input
              placeholder="Meal name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-border/50 focus:border-primary transition-colors"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Calories *"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className="border-border/50 focus:border-primary transition-colors"
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Protein (g)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="border-border/50 focus:border-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.1"
                placeholder="Carbs (g)"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="border-border/50 focus:border-primary transition-colors"
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Fats (g)"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                className="border-border/50 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 btn-gradient-primary">
                Save Custom Meal
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-border/50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {customMeals.length === 0 ? (
          <Card className="p-12 text-center card-glass">
            <BookPlus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No custom meals yet. Create one to reuse frequently!</p>
          </Card>
        ) : (
          customMeals.map((meal) => (
            <Card key={meal.id} className="p-6 card-glass hover-lift">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{meal.name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm mb-4">
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
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUseCustomMeal(meal)}
                      size="sm"
                      className="btn-gradient-primary"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add to Today
                    </Button>
                    <Button
                      onClick={() => handleDeleteCustomMeal(meal.id)}
                      size="sm"
                      variant="outline"
                      className="border-border/50 hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};