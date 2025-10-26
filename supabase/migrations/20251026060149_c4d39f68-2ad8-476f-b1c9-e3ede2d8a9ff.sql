-- Create user profiles table for personalized tracking
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  fitness_goal TEXT CHECK (fitness_goal IN ('maintain', 'lose_fat', 'build_muscle')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create food database table with Indian foods
CREATE TABLE public.food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cuisine TEXT DEFAULT 'indian',
  serving_size TEXT,
  calories INTEGER NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fats NUMERIC NOT NULL,
  fiber NUMERIC,
  is_healthy BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Food database is readable by all authenticated users"
ON public.food_database FOR SELECT
TO authenticated
USING (true);

-- Insert comprehensive Indian food database
INSERT INTO public.food_database (name, category, cuisine, serving_size, calories, protein, carbs, fats, fiber, is_healthy, tags) VALUES
-- Breakfast items
('Idli (2 pieces)', 'breakfast', 'indian', '2 pieces (150g)', 120, 4, 24, 0.5, 2, true, ARRAY['vegetarian', 'low-fat', 'south-indian']),
('Dosa (plain)', 'breakfast', 'indian', '1 dosa (100g)', 168, 4, 30, 3.7, 1, true, ARRAY['vegetarian', 'south-indian']),
('Masala Dosa', 'breakfast', 'indian', '1 dosa (200g)', 275, 7, 45, 7, 3, true, ARRAY['vegetarian', 'south-indian']),
('Upma', 'breakfast', 'indian', '1 cup (200g)', 220, 5, 38, 6, 3, true, ARRAY['vegetarian', 'south-indian']),
('Poha', 'breakfast', 'indian', '1 cup (150g)', 180, 4, 30, 5, 2, true, ARRAY['vegetarian', 'light']),
('Paratha (plain)', 'breakfast', 'indian', '1 piece (100g)', 260, 6, 38, 9, 2, false, ARRAY['vegetarian', 'north-indian']),
('Aloo Paratha', 'breakfast', 'indian', '1 piece (150g)', 350, 8, 48, 14, 3, false, ARRAY['vegetarian', 'north-indian']),

-- Rice and Grains
('Basmati Rice (cooked)', 'grains', 'indian', '1 cup (158g)', 210, 4.4, 45, 0.5, 0.6, true, ARRAY['vegetarian', 'staple']),
('Brown Rice (cooked)', 'grains', 'indian', '1 cup (195g)', 216, 5, 45, 1.8, 3.5, true, ARRAY['vegetarian', 'healthy', 'staple']),
('Jeera Rice', 'grains', 'indian', '1 cup (200g)', 240, 5, 46, 4, 1, true, ARRAY['vegetarian', 'north-indian']),
('Biryani (veg)', 'rice', 'indian', '1 plate (300g)', 420, 10, 65, 12, 4, false, ARRAY['vegetarian']),
('Biryani (chicken)', 'rice', 'indian', '1 plate (350g)', 550, 28, 62, 18, 3, false, ARRAY['non-vegetarian', 'high-protein']),

-- Breads
('Roti (whole wheat)', 'breads', 'indian', '1 piece (40g)', 100, 3, 18, 2, 2, true, ARRAY['vegetarian', 'staple']),
('Naan', 'breads', 'indian', '1 piece (90g)', 262, 7, 45, 5, 2, false, ARRAY['vegetarian']),
('Chapati', 'breads', 'indian', '1 piece (40g)', 104, 3.1, 18, 2.2, 2, true, ARRAY['vegetarian', 'staple']),

-- Dals and Lentils
('Dal Tadka', 'dal', 'indian', '1 bowl (200ml)', 180, 9, 25, 5, 6, true, ARRAY['vegetarian', 'high-protein', 'healthy']),
('Dal Makhani', 'dal', 'indian', '1 bowl (200ml)', 280, 12, 30, 12, 8, false, ARRAY['vegetarian', 'high-protein']),
('Moong Dal', 'dal', 'indian', '1 bowl (200ml)', 160, 10, 24, 3, 7, true, ARRAY['vegetarian', 'high-protein', 'healthy']),
('Sambar', 'dal', 'indian', '1 bowl (200ml)', 150, 7, 22, 4, 5, true, ARRAY['vegetarian', 'south-indian', 'healthy']),

-- Curries and Sabzis
('Paneer Butter Masala', 'curry', 'indian', '1 bowl (200g)', 380, 16, 18, 28, 2, false, ARRAY['vegetarian', 'high-fat']),
('Palak Paneer', 'curry', 'indian', '1 bowl (200g)', 280, 14, 15, 20, 4, true, ARRAY['vegetarian', 'healthy']),
('Chicken Curry', 'curry', 'indian', '1 bowl (250g)', 320, 32, 12, 16, 3, true, ARRAY['non-vegetarian', 'high-protein']),
('Chicken Tikka Masala', 'curry', 'indian', '1 bowl (250g)', 400, 30, 15, 24, 2, false, ARRAY['non-vegetarian', 'high-protein']),
('Chole (Chickpea Curry)', 'curry', 'indian', '1 bowl (200g)', 240, 12, 35, 6, 10, true, ARRAY['vegetarian', 'high-protein', 'healthy']),
('Aloo Gobi', 'sabzi', 'indian', '1 bowl (200g)', 180, 4, 28, 6, 4, true, ARRAY['vegetarian', 'healthy']),
('Bhindi Masala', 'sabzi', 'indian', '1 bowl (150g)', 160, 3, 18, 8, 5, true, ARRAY['vegetarian', 'healthy']),
('Mixed Veg Sabzi', 'sabzi', 'indian', '1 bowl (200g)', 140, 4, 20, 5, 4, true, ARRAY['vegetarian', 'healthy']),

-- Snacks
('Samosa (1 piece)', 'snacks', 'indian', '1 piece (100g)', 262, 5, 32, 12, 3, false, ARRAY['vegetarian', 'fried']),
('Pakora (5 pieces)', 'snacks', 'indian', '5 pieces (100g)', 280, 6, 28, 16, 3, false, ARRAY['vegetarian', 'fried']),
('Dhokla', 'snacks', 'indian', '2 pieces (100g)', 160, 5, 28, 3, 2, true, ARRAY['vegetarian', 'healthy', 'gujarati']),
('Kachori (1 piece)', 'snacks', 'indian', '1 piece (100g)', 270, 6, 30, 14, 2, false, ARRAY['vegetarian', 'fried']),

-- Protein Sources
('Chicken Breast (grilled)', 'protein', 'indian', '100g', 165, 31, 0, 3.6, 0, true, ARRAY['non-vegetarian', 'high-protein', 'lean']),
('Paneer', 'protein', 'indian', '100g', 265, 18, 1.2, 20, 0, false, ARRAY['vegetarian', 'high-protein', 'high-fat']),
('Boiled Eggs (2)', 'protein', 'indian', '2 eggs (100g)', 155, 13, 1.1, 11, 0, true, ARRAY['non-vegetarian', 'high-protein']),
('Fish Curry (Bengali)', 'protein', 'indian', '1 bowl (200g)', 220, 28, 6, 9, 1, true, ARRAY['non-vegetarian', 'high-protein']),

-- Healthy Options
('Quinoa (cooked)', 'grains', 'international', '1 cup (185g)', 222, 8, 39, 3.6, 5, true, ARRAY['vegetarian', 'high-protein', 'healthy']),
('Oats (cooked)', 'breakfast', 'international', '1 cup (234g)', 166, 5.9, 28, 3.6, 4, true, ARRAY['vegetarian', 'healthy']),
('Greek Yogurt', 'dairy', 'international', '1 cup (200g)', 146, 20, 7.8, 4, 0, true, ARRAY['vegetarian', 'high-protein']),
('Sprouts Salad', 'salad', 'indian', '1 bowl (150g)', 120, 8, 18, 2, 6, true, ARRAY['vegetarian', 'healthy', 'high-protein']),

-- Sweets (limited portions)
('Gulab Jamun (1 piece)', 'sweets', 'indian', '1 piece (50g)', 175, 2, 28, 7, 0, false, ARRAY['vegetarian', 'dessert']),
('Rasgulla (1 piece)', 'sweets', 'indian', '1 piece (50g)', 106, 2, 22, 1, 0, false, ARRAY['vegetarian', 'dessert']),
('Kheer', 'sweets', 'indian', '1 bowl (150ml)', 200, 5, 32, 6, 0, false, ARRAY['vegetarian', 'dessert']);

-- Create meal plans table for AI suggestions
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = user_id);