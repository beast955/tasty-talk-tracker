import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NLPInput } from "./NLPInput";
import { ManualEntry } from "./ManualEntry";
import { MealList } from "./MealList";
import { StatsOverview } from "./StatsOverview";
import { CustomMeals } from "./CustomMeals";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManual, setShowManual] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
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
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-border/50 hover:border-destructive hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Overview */}
        <StatsOverview key={`stats-${refreshKey}`} />

        {/* Main Content */}
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Add Meals
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              History
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Custom Meals
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