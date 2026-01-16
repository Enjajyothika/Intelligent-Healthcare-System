-- Create patient profiles table
CREATE TABLE public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  address TEXT,
  blood_group TEXT,
  allergies TEXT,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctor profiles table
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  license_number TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  bio TEXT,
  wallet_address TEXT NOT NULL,
  phone TEXT,
  consultation_fee DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health metrics table for patients
CREATE TABLE public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  bmi DECIMAL(4,2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  blood_sugar DECIMAL(5,2),
  temperature DECIMAL(4,2),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_profiles
CREATE POLICY "Users can view their own patient profile"
  ON public.patient_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient profile"
  ON public.patient_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient profile"
  ON public.patient_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient profiles"
  ON public.patient_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for doctor_profiles
CREATE POLICY "Users can view their own doctor profile"
  ON public.doctor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doctor profile"
  ON public.doctor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doctor profile"
  ON public.doctor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (true);

-- RLS Policies for health_metrics
CREATE POLICY "Patients can view their own health metrics"
  ON public.health_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE patient_profiles.id = health_metrics.patient_id
      AND patient_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can insert their own health metrics"
  ON public.health_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE patient_profiles.id = health_metrics.patient_id
      AND patient_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view patient health metrics"
  ON public.health_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE patient_profiles.id = appointments.patient_id
      AND patient_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their appointments"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = appointments.doctor_id
      AND doctor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE patient_profiles.id = appointments.patient_id
      AND patient_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE patient_profiles.id = appointments.patient_id
      AND patient_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their appointments"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = appointments.doctor_id
      AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_patient_profiles_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create patient profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_patient()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'patient' THEN
    INSERT INTO public.patient_profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Patient'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create doctor profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_doctor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'doctor' THEN
    INSERT INTO public.doctor_profiles (user_id, full_name, specialization, license_number, experience_years, wallet_address)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Doctor'),
      'General Practice',
      'PENDING',
      0,
      COALESCE(NEW.raw_user_meta_data->>'wallet_address', '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto profile creation
CREATE TRIGGER on_auth_user_created_patient
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_patient();

CREATE TRIGGER on_auth_user_created_doctor
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_doctor();

-- Create indexes for better performance
CREATE INDEX idx_patient_profiles_user_id ON public.patient_profiles(user_id);
CREATE INDEX idx_doctor_profiles_user_id ON public.doctor_profiles(user_id);
CREATE INDEX idx_health_metrics_patient_id ON public.health_metrics(patient_id);
CREATE INDEX idx_health_metrics_recorded_at ON public.health_metrics(recorded_at DESC);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);