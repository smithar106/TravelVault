-- TravelVault Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  travelvault_email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  quiz_completed BOOLEAN DEFAULT FALSE,
  acquisition_source TEXT
);

-- Travel profiles
CREATE TABLE IF NOT EXISTS public.travel_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  travel_style_tags TEXT[] DEFAULT '{}',
  preferred_accommodation TEXT DEFAULT 'boutique' CHECK (preferred_accommodation IN ('budget', 'boutique', 'luxury')),
  trip_pace TEXT DEFAULT 'moderate' CHECK (trip_pace IN ('relaxed', 'moderate', 'packed')),
  interests TEXT[] DEFAULT '{}',
  total_trips INT DEFAULT 0,
  countries_visited TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'car', 'activity', 'other')),
  raw_email TEXT,
  parsed_data JSONB DEFAULT '{}',
  confirmation_number TEXT,
  provider_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled'))
);

-- Destination guides
CREATE TABLE IF NOT EXISTS public.destination_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE UNIQUE,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  neighborhood_tips JSONB DEFAULT '{}',
  packing_list JSONB DEFAULT '{}',
  practical_info JSONB DEFAULT '{}',
  weather_summary TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip ratings
CREATE TABLE IF NOT EXISTS public.trip_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5),
  style_tags_confirmed TEXT[] DEFAULT '{}',
  notes TEXT,
  rated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'visa', 'insurance', 'vaccine', 'other')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expires_at DATE
);

-- Quiz leads
CREATE TABLE IF NOT EXISTS public.quiz_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  quiz_data JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_user BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_travelvault_email ON public.users(travelvault_email);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_destination_guides_trip_id ON public.destination_guides(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_profiles_user_id ON public.travel_profiles(user_id);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

-- Users: users can read/update their own row
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can insert users
CREATE POLICY "Service can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Travel profiles
CREATE POLICY "Users can read own profile" ON public.travel_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.travel_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Trips
CREATE POLICY "Users can manage own trips" ON public.trips
  FOR ALL USING (auth.uid() = user_id);

-- Bookings
CREATE POLICY "Users can manage own bookings" ON public.bookings
  FOR ALL USING (auth.uid() = user_id);

-- Destination guides
CREATE POLICY "Users can read own guides" ON public.destination_guides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = destination_guides.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage guides" ON public.destination_guides
  FOR ALL USING (true);

-- Trip ratings
CREATE POLICY "Users can manage own ratings" ON public.trip_ratings
  FOR ALL USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Quiz leads: anyone can insert, service can read
CREATE POLICY "Anyone can insert quiz leads" ON public.quiz_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can read quiz leads" ON public.quiz_leads
  FOR SELECT USING (true);

-- Function to generate travelvault email on user creation
CREATE OR REPLACE FUNCTION public.generate_travelvault_email(first_name TEXT)
RETURNS TEXT AS $$
DECLARE
  random_str TEXT;
  clean_name TEXT;
BEGIN
  clean_name := LOWER(REGEXP_REPLACE(COALESCE(first_name, 'traveler'), '[^a-zA-Z0-9]', '', 'g'));
  IF clean_name = '' THEN
    clean_name := 'traveler';
  END IF;
  random_str := SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6);
  RETURN clean_name || '-' || random_str || '@in.travelvault.app';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create user profile on trip count change
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.travel_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
