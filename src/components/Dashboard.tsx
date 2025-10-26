import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NLPInput } from "./NLPInput";
import { ManualEntry } from "./ManualEntry";
import { MealList } from "./MealList";
import { StatsOverview } from "./StatsOverview";
import { CustomMeals } from "./CustomMeals";
import { PresetMealSelector } from "./PresetMealSelector";
import { AIMealPlan } from "./AIMealPlan";
import { LogOut, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [goals, setGoals] = useState<any>(null);
  const [editingGoals, setEditingGoals] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [refreshKey]);

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("daily_goals")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setGoals(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const updateGoals = async (newGoals: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("daily_goals")
        .update(newGoals)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Goals updated!");
      setEditingGoals(false);
      refreshData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              CaloriTrack
            </h1>
            <p className="text-muted-foreground mt-1">Track your nutrition with AI</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={editingGoals} onOpenChange={setEditingGoals}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-border/50 hover:border-primary hover:text-primary transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Goals
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Daily Goals</DialogTitle>
                  <DialogDescription>
                    Customize your daily nutrition targets
                  </DialogDescription>
                </DialogHeader>
                {goals && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Calories</Label>
                      <Input
                        type="number"
                        defaultValue={goals.calorie_goal}
                        onChange={(e) => setGoals({ ...goals, calorie_goal: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Protein (g)</Label>
                        <Input
                          type="number"
                          defaultValue={goals.protein_goal}
                          onChange={(e) => setGoals({ ...goals, protein_goal: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Carbs (g)</Label>
                        <Input
                          type="number"
                          defaultValue={goals.carbs_goal}
                          onChange={(e) => setGoals({ ...goals, carbs_goal: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fats (g)</Label>
                        <Input
                          type="number"
                          defaultValue={goals.fats_goal}
                          onChange={(e) => setGoals({ ...goals, fats_goal: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <Button onClick={() => updateGoals(goals)} className="w-full btn-gradient-primary">
                      Save Changes
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-border/50 hover:border-destructive hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview key={`stats-${refreshKey}`} />

        {/* Main Content */}
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Add Meals
            </TabsTrigger>
            <TabsTrigger value="preset" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Quick Add
            </TabsTrigger>
            <TabsTrigger value="ai-plan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              AI Plan
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              History
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-6 mt-6">
            <NLPInput onMealsAdded={refreshData} />
            
            {!showManual && (
              <Button
                onClick={() => setShowManual(true)}
                variant="outline"
                className="w-full border-border/50 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Or Add Manually
              </Button>
            )}
            
            {showManual && (
              <ManualEntry 
                onMealAdded={refreshData}
                onCancel={() => setShowManual(false)}
              />
            )}
          </TabsContent>

          <TabsContent value="preset" className="mt-6">
            <PresetMealSelector onMealAdded={refreshData} />
          </TabsContent>

          <TabsContent value="ai-plan" className="mt-6">
            <AIMealPlan />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <MealList key={`meals-${refreshKey}`} onMealDeleted={refreshData} />
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <CustomMeals onMealAdded={refreshData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};