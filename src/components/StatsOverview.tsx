import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, TrendingUp } from "lucide-react";

interface Stats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  goal: number;
}

export const StatsOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    goal: 2000
  });

  useEffect(() => {
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.data.user.id)
        .gte('created_at', today.toISOString());

      const { data: goalData } = await supabase
        .from('daily_goals')
        .select('calorie_goal')
        .eq('user_id', user.data.user.id)
        .single();

      if (meals) {
        const totals = meals.reduce((acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.calories || 0),
          totalProtein: acc.totalProtein + (meal.protein || 0),
          totalCarbs: acc.totalCarbs + (meal.carbs || 0),
          totalFats: acc.totalFats + (meal.fats || 0),
        }), { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 });

        setStats({
          ...totals,
          goal: goalData?.calorie_goal || 2000
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const progress = Math.min((stats.totalCalories / stats.goal) * 100, 100);
  const remaining = Math.max(stats.goal - stats.totalCalories, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Main Calorie Card */}
      <Card className="md:col-span-2 p-6 stat-card bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm text-muted-foreground">Today's Calories</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {stats.totalCalories}
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-3 mb-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Goal: {stats.goal} cal
          </span>
          <span className={remaining > 0 ? "text-primary" : "text-accent"}>
            {remaining > 0 ? `${remaining} remaining` : "Goal reached!"}
          </span>
        </div>
      </Card>

      {/* Macros Card */}
      <Card className="p-6 stat-card bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-secondary" />
          <h3 className="font-semibold">Macros Today</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Protein</span>
            <span className="font-semibold text-accent">{stats.totalProtein.toFixed(1)}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Carbs</span>
            <span className="font-semibold text-secondary">{stats.totalCarbs.toFixed(1)}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fats</span>
            <span className="font-semibold text-warning">{stats.totalFats.toFixed(1)}g</span>
          </div>
        </div>
      </Card>
    </div>
  );
};