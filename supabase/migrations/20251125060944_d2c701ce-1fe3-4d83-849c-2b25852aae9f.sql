-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  diagnosis TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  prescribed_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Doctors can create prescriptions
CREATE POLICY "Doctors can create prescriptions"
ON public.prescriptions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = prescriptions.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Doctors can view their own prescriptions
CREATE POLICY "Doctors can view their prescriptions"
ON public.prescriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = prescriptions.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Doctors can update their own prescriptions
CREATE POLICY "Doctors can update their prescriptions"
ON public.prescriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = prescriptions.doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Patients can view their own prescriptions
CREATE POLICY "Patients can view their prescriptions"
ON public.prescriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patient_profiles
    WHERE patient_profiles.id = prescriptions.patient_id
    AND patient_profiles.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();