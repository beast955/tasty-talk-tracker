import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, TrendingDown, TrendingUp } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [loading, setLoading] = useState(false);

  const goalOptions = [
    { value: "maintain", label: "Maintain Weight", icon: Target, color: "from-primary to-primary-glow" },
    { value: "lose_fat", label: "Lose Fat", icon: TrendingDown, color: "from-warning to-accent" },
    { value: "build_muscle", label: "Build Muscle", icon: TrendingUp, color: "from-secondary to-accent" }
  ];

  const calculateMacros = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
    
    // Adjust calories based on goal
    let targetCalories = tdee;
    let proteinRatio = 0.25;
    let carbsRatio = 0.45;
    let fatsRatio = 0.30;

    if (goal === "lose_fat") {
      targetCalories = tdee - 500; // 500 calorie deficit
      proteinRatio = 0.35; // Higher protein for muscle preservation
      carbsRatio = 0.35;
      fatsRatio = 0.30;
    } else if (goal === "build_muscle") {
      targetCalories = tdee + 300; // 300 calorie surplus
      proteinRatio = 0.30;
      carbsRatio = 0.45;
      fatsRatio = 0.25;
    }

    return {
      calories: Math.round(targetCalories),
      protein: Math.round((targetCalories * proteinRatio) / 4),
      carbs: Math.round((targetCalories * carbsRatio) / 4),
      fats: Math.round((targetCalories * fatsRatio) / 9)
    };
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const macros = calculateMacros();

      // Save user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          height_cm: parseFloat(height),
          weight_kg: parseFloat(weight),
          age: parseInt(age),
          gender,
          activity_level: activityLevel,
          fitness_goal: goal
        });

      if (profileError) throw profileError;

      // Save daily goals
      const { error: goalsError } = await supabase
        .from("daily_goals")
        .upsert({
          user_id: user.id,
          calorie_goal: macros.calories,
          protein_goal: macros.protein,
          carbs_goal: macros.carbs,
          fats_goal: macros.fats
        });

      if (goalsError) throw goalsError;

      toast.success("Profile setup complete!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
        <Card className="w-full max-w-2xl card-glass border-2">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Welcome to CaloriTrack
            </CardTitle>
            <CardDescription className="text-lg">
              Let's personalize your fitness journey. What's your goal?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {goalOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setGoal(option.value);
                    setStep(2);
                  }}
                  className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                    goal === option.value ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, var(--${option.value === 'maintain' ? 'primary' : option.value === 'lose_fat' ? 'warning' : 'secondary'}), var(--accent))`
                  }}
                >
                  <div className="relative flex items-center gap-4 text-white">
                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{option.label}</h3>
                      <p className="text-white/80 mt-1">
                        {option.value === "maintain" && "Stay healthy and balanced"}
                        {option.value === "lose_fat" && "Burn fat and get lean"}
                        {option.value === "build_muscle" && "Gain strength and mass"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <Card className="w-full max-w-2xl card-glass border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tell Us About Yourself
          </CardTitle>
          <CardDescription>We'll calculate your personalized nutrition goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="border-border/50 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Age</Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Activity Level</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger className="border-border/50 focus:border-primary">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                <SelectItem value="very_active">Very Active (intense daily exercise)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="flex-1 border-border/50 hover:border-primary"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={loading || !height || !weight || !age || !gender || !activityLevel}
              className="flex-1 btn-gradient-primary"
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
