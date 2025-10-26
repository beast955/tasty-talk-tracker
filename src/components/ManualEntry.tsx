import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface ManualEntryProps {
  onMealAdded: () => void;
  onCancel?: () => void;
}

export const ManualEntry = ({ onMealAdded, onCancel }: ManualEntryProps) => {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      const { error } = await supabase.from('meals').insert({
        user_id: user.data.user.id,
        name,
        calories: parseInt(calories),
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
        meal_time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });

      if (error) throw error;

      toast.success("Meal added successfully!");
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      onMealAdded();
      onCancel?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 card-glass hover-lift">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Manual Entry</h3>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button
          type="submit"
          disabled={loading}
          className="w-full btn-gradient-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          {loading ? "Adding..." : "Add Meal"}
        </Button>
      </form>
    </Card>
  );
};