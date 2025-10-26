-- Create meals table to store user meal entries
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fats DECIMAL(10,2),
  meal_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom meals table for user-saved meals
CREATE TABLE public.custom_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fats DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily goals table
CREATE TABLE public.daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  calorie_goal INTEGER DEFAULT 2000,
  protein_goal DECIMAL(10,2) DEFAULT 50,
  carbs_goal DECIMAL(10,2) DEFAULT 250,
  fats_goal DECIMAL(10,2) DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meals
CREATE POLICY "Users can view their own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for custom meals
CREATE POLICY "Users can view their own custom meals"
  ON public.custom_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom meals"
  ON public.custom_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom meals"
  ON public.custom_meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom meals"
  ON public.custom_meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily goals
CREATE POLICY "Users can view their own goals"
  ON public.daily_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.daily_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.daily_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_goals_updated_at
  BEFORE UPDATE ON public.daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();