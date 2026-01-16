-- Add foreign key constraints to prescriptions table
ALTER TABLE public.prescriptions
ADD CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES public.patient_profiles(id) ON DELETE CASCADE;