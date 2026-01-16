-- Create doctor availability/time slots table
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create appointment slots table for specific bookings
CREATE TABLE public.appointment_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, slot_date, start_time)
);

-- Enable RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_availability

-- Everyone can view doctor availability
CREATE POLICY "Anyone can view doctor availability"
ON public.doctor_availability
FOR SELECT
TO authenticated
USING (true);

-- Doctors can manage their own availability
CREATE POLICY "Doctors can insert their availability"
ON public.doctor_availability
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = doctor_availability.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their availability"
ON public.doctor_availability
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = doctor_availability.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can delete their availability"
ON public.doctor_availability
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = doctor_availability.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- RLS Policies for appointment_slots

-- Everyone can view available slots
CREATE POLICY "Anyone can view appointment slots"
ON public.appointment_slots
FOR SELECT
TO authenticated
USING (true);

-- Doctors can create slots
CREATE POLICY "Doctors can create slots"
ON public.appointment_slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = appointment_slots.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Doctors and patients can update slots (for booking)
CREATE POLICY "Doctors can update their slots"
ON public.appointment_slots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = appointment_slots.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can book slots"
ON public.appointment_slots
FOR UPDATE
TO authenticated
USING (is_booked = false); -- Can only book available slots

-- Add indexes for performance
CREATE INDEX idx_doctor_availability_doctor ON public.doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_day ON public.doctor_availability(day_of_week);
CREATE INDEX idx_appointment_slots_doctor_date ON public.appointment_slots(doctor_id, slot_date);
CREATE INDEX idx_appointment_slots_booked ON public.appointment_slots(is_booked);

-- Add trigger for updated_at
CREATE TRIGGER update_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_slots_updated_at
BEFORE UPDATE ON public.appointment_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add additional fields to doctor_profiles for better profile
ALTER TABLE public.doctor_profiles
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_phone TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT;