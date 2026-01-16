-- Enable realtime for prescriptions table
ALTER TABLE public.prescriptions REPLICA IDENTITY FULL;

-- Add the table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;