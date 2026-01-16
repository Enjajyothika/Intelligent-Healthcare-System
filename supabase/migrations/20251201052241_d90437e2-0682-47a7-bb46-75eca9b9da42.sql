-- Create a security definer function to book appointments
-- This bypasses RLS policies safely in a controlled way
CREATE OR REPLACE FUNCTION public.book_appointment_slot(
  p_doctor_id UUID,
  p_slot_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_patient_id UUID,
  p_reason TEXT,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_id UUID;
  v_appointment_id UUID;
  v_appointment_date TIMESTAMP;
BEGIN
  -- Combine date and time for appointment_date
  v_appointment_date := p_slot_date + p_start_time;
  
  -- Check if slot already exists and is not booked
  SELECT id INTO v_slot_id
  FROM appointment_slots
  WHERE doctor_id = p_doctor_id
    AND slot_date = p_slot_date
    AND start_time = p_start_time
    AND end_time = p_end_time
    AND (is_booked = false OR is_booked IS NULL);
  
  -- If slot doesn't exist, create it
  IF v_slot_id IS NULL THEN
    INSERT INTO appointment_slots (
      doctor_id,
      slot_date,
      start_time,
      end_time,
      is_booked
    )
    VALUES (
      p_doctor_id,
      p_slot_date,
      p_start_time,
      p_end_time,
      false
    )
    RETURNING id INTO v_slot_id;
  END IF;
  
  -- Create the appointment
  INSERT INTO appointments (
    doctor_id,
    patient_id,
    appointment_date,
    reason,
    notes,
    status
  )
  VALUES (
    p_doctor_id,
    p_patient_id,
    v_appointment_date,
    p_reason,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_appointment_id;
  
  -- Mark the slot as booked and link to appointment
  UPDATE appointment_slots
  SET is_booked = true,
      appointment_id = v_appointment_id
  WHERE id = v_slot_id;
  
  -- Return success with IDs
  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'slot_id', v_slot_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;