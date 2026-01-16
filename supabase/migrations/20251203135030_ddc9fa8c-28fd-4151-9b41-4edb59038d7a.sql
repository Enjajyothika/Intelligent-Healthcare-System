-- Allow patients to upload their own medical reports
CREATE POLICY "Patients can upload their own reports" 
ON public.medical_reports 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_profiles 
    WHERE patient_profiles.id = medical_reports.patient_id 
    AND patient_profiles.user_id = auth.uid()
  )
  AND uploaded_by_doctor_id IS NULL
);

-- Allow patients to upload to medical-reports storage bucket
CREATE POLICY "Patients can upload to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medical-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow patients to read their own files from storage
CREATE POLICY "Patients can read their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);