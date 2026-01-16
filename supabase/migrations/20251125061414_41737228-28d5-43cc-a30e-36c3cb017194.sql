-- Create medical reports table with audit trail
CREATE TABLE public.medical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  uploaded_by_doctor_id UUID REFERENCES public.doctor_profiles(id),
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  hash TEXT NOT NULL, -- Hash for integrity verification (blockchain-like)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit log table for immutable history (blockchain-like)
CREATE TABLE public.report_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  accessed_by_user_id UUID NOT NULL,
  accessed_by_type TEXT NOT NULL, -- 'doctor' or 'patient'
  action TEXT NOT NULL, -- 'view', 'download', 'upload'
  ip_address TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical reports

-- Patients can view their own reports
CREATE POLICY "Patients can view their own reports"
ON public.medical_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patient_profiles
    WHERE patient_profiles.id = medical_reports.patient_id
    AND patient_profiles.user_id = auth.uid()
  )
);

-- Doctors can view all reports (for their patients)
CREATE POLICY "Doctors can view reports"
ON public.medical_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.user_id = auth.uid()
  )
);

-- Doctors can upload reports
CREATE POLICY "Doctors can upload reports"
ON public.medical_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = medical_reports.uploaded_by_doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Doctors can update reports they uploaded
CREATE POLICY "Doctors can update their uploaded reports"
ON public.medical_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.id = medical_reports.uploaded_by_doctor_id
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- RLS Policies for access log

-- Users can view their own access logs
CREATE POLICY "Users can view their access logs"
ON public.report_access_log
FOR SELECT
TO authenticated
USING (accessed_by_user_id = auth.uid());

-- Anyone authenticated can insert access logs
CREATE POLICY "Authenticated users can insert access logs"
ON public.report_access_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = accessed_by_user_id);

-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false);

-- Storage policies for medical reports bucket

-- Doctors can upload files
CREATE POLICY "Doctors can upload medical reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-reports' AND
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.user_id = auth.uid()
  )
);

-- Doctors can view all files
CREATE POLICY "Doctors can view medical reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.user_id = auth.uid()
  )
);

-- Patients can view their own files
CREATE POLICY "Patients can view their own reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

-- Enhance appointments table with better scheduling
ALTER TABLE public.appointments
ADD COLUMN appointment_type TEXT DEFAULT 'consultation',
ADD COLUMN duration_minutes INTEGER DEFAULT 30,
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN rescheduled_from UUID REFERENCES public.appointments(id),
ADD COLUMN confirmation_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_medical_reports_patient ON public.medical_reports(patient_id);

-- Add trigger for updated_at
CREATE TRIGGER update_medical_reports_updated_at
BEFORE UPDATE ON public.medical_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate file hash
CREATE OR REPLACE FUNCTION public.generate_file_hash(file_content TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
  SELECT md5(file_content);
$$;