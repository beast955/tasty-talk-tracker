import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Flame, Drumstick, Wheat, Salad } from "lucide-react";

interface Food {
  id: string;
  name: string;
  category: string;
  cuisine: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  is_healthy: boolean;
  tags: string[];
}

interface PresetMealSelectorProps {
  onMealAdded: () => void;
}

export const PresetMealSelector = ({ onMealAdded }: PresetMealSelectorProps) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchQuery, selectedCategory, foods]);

  const fetchFoods = async () => {
    const { data, error } = await supabase
      .from("food_database")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load food database");
      return;
    }

    setFoods(data || []);
  };

  const filterFoods = () => {
    let filtered = foods;

    if (searchQuery) {
      filtered = filtered.filter((food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((food) => food.category === selectedCategory);
    }

    setFilteredFoods(filtered);
  };

  const addMeal = async (food: Food) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        meal_time: new Date().toISOString()
      });

      if (error) throw error;

      toast.success(`Added ${food.name}!`);
      onMealAdded();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "all", label: "All Foods", icon: Salad },
    { value: "breakfast", label: "Breakfast", icon: Flame },
    { value: "protein", label: "Proteins", icon: Drumstick },
    { value: "grains", label: "Grains", icon: Wheat },
    { value: "dal", label: "Dals", icon: Salad },
    { value: "curry", label: "Curries", icon: Flame },
  ];

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <Salad className="w-6 h-6 text-primary" />
          Quick Add Meals
        </CardTitle>
        <CardDescription>
          Select from our database of Indian and healthy foods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search foods (e.g., 'idli', 'protein', 'healthy')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-border/50 focus:border-primary"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-card/50">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <cat.icon className="w-4 h-4 mr-1" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-3">
                {filteredFoods.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No foods found. Try a different search or category.
                  </p>
                ) : (
                  filteredFoods.map((food) => (
                    <Card key={food.id} className="hover-lift border border-border/50 hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-foreground">{food.name}</h4>
                                <p className="text-sm text-muted-foreground">{food.serving_size}</p>
                              </div>
                              {food.is_healthy && (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                  Healthy
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Flame className="w-4 h-4 text-warning" />
                                <strong>{food.calories}</strong> cal
                              </span>
                              <span className="text-muted-foreground">
                                P: <strong>{food.protein}g</strong>
                              </span>
                              <span className="text-muted-foreground">
                                C: <strong>{food.carbs}g</strong>
                              </span>
                              <span className="text-muted-foreground">
                                F: <strong>{food.fats}g</strong>
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {food.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <Button
                            onClick={() => addMeal(food)}
                            disabled={loading}
                            size="sm"
                            className="btn-gradient-primary shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
