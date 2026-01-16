import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Stethoscope,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";

/* ================= TYPES ================= */

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number | null;
  is_available: boolean;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

/* ================= COMPONENT ================= */

const BookAppointment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [patientId, setPatientId] = useState<string | null>(null);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("all");

  /* ================= INIT ================= */

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedDoctor) fetchAvailabilityDays();
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) fetchSlots();
  }, [selectedDate]);

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/patient/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile) setPatientId(profile.id);

    const { data } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("is_available", true)
      .order("full_name");

    if (data) setDoctors(data);
  };

  /* ================= AVAILABILITY ================= */

  const fetchAvailabilityDays = async () => {
    if (!selectedDoctor) return;

    setSelectedDate(undefined);
    setAvailableSlots([]);
    setSelectedSlot(null);

    const { data } = await supabase
      .from("doctor_availability")
      .select("day_of_week")
      .eq("doctor_id", selectedDoctor.id)
      .eq("is_available", true);

    setAvailableDays(data?.map((d) => d.day_of_week) || []);
  };

  const fetchSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    const jsDay = selectedDate.getDay();
    const day = jsDay === 0 ? 7 : jsDay;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data: availability } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", selectedDoctor.id)
      .eq("day_of_week", day)
      .eq("is_available", true)
      .single();

    if (!availability) return;

    let slots = generateSlots(availability);

    /* 🔥 REAL-TIME SLOT FILTER (TODAY ONLY) */
    const now = new Date();
    const todayStr = format(new Date(), "yyyy-MM-dd");

    if (dateStr === todayStr) {
      slots = slots.filter((slot) => {
        const slotTime = new Date(`${dateStr}T${slot.start_time}`);
        return slotTime > now;
      });
    }

    /* ❌ REMOVE ALREADY BOOKED SLOTS */
    const { data: booked } = await supabase
      .from("appointments")
      .select("appointment_date")
      .eq("doctor_id", selectedDoctor.id)
      .gte("appointment_date", `${dateStr}T00:00:00`)
      .lt("appointment_date", `${dateStr}T23:59:59`);

    slots = slots.filter((slot) => {
      return !booked?.some(
        (b) =>
          new Date(b.appointment_date).getTime() ===
          new Date(`${dateStr}T${slot.start_time}`).getTime()
      );
    });

    setAvailableSlots(slots.map((s, i) => ({ ...s, id: `s-${i}` })));
  };

  const generateSlots = (a: any): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const toTime = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
        m % 60
      ).padStart(2, "0")}`;

    let cur = toMin(a.start_time.substring(0, 5));
    const end = toMin(a.end_time.substring(0, 5));

    while (cur + 60 <= end) {
      slots.push({
        id: "",
        start_time: `${toTime(cur)}:00`,
        end_time: `${toTime(cur + 60)}:00`,
      });
      cur += 60;
    }

    return slots;
  };

  /* ================= BOOK ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !selectedDoctor || !selectedDate || !selectedSlot) {
      toast({ title: "Missing details", variant: "destructive" });
      return;
    }

    const appointmentAt = new Date(
      `${format(selectedDate, "yyyy-MM-dd")}T${selectedSlot.start_time}`
    ).toISOString();

    if (new Date(appointmentAt) <= new Date()) {
      toast({
        title: "Cannot book past time",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.rpc("book_appointment_slot", {
      p_doctor_id: selectedDoctor.id,
      p_patient_id: patientId,
      p_appointment_at: appointmentAt,
      p_reason: reason,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Appointment booked successfully" });
    navigate("/patient/dashboard");
  };

  /* ================= FILTER ================= */

  const specializations = [
    "all",
    ...Array.from(new Set(doctors.map((d) => d.specialization))),
  ];

  const filteredDoctors =
    filterSpecialization === "all"
      ? doctors
      : doctors.filter((d) => d.specialization === filterSpecialization);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <Button variant="ghost" onClick={() => navigate("/patient/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold my-6">Book Appointment</h1>

      {!selectedDoctor ? (
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle>Select a Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={filterSpecialization}
              onValueChange={setFilterSpecialization}
            >
              <SelectTrigger className="mb-4">
                <SelectValue placeholder="Filter by specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => setSelectedDoctor(doc)}
                >
                  <CardContent className="p-4 space-y-2">
                    <Stethoscope className="text-primary" />
                    <h3 className="font-semibold">{doc.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.specialization}
                    </p>
                    <Badge variant="secondary">
                      {doc.experience_years} yrs experience
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => {
              setSelectedDoctor(null);
              setSelectedDate(undefined);
              setAvailableSlots([]);
              setSelectedSlot(null);
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to doctors
          </Button>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{selectedDoctor.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{selectedDoctor.specialization}</p>
                <Badge className="mt-2">
                  {selectedDoctor.experience_years} yrs experience
                </Badge>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Book Appointment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(d) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          if (d < today) return true;

                          const js = d.getDay();
                          const day = js === 0 ? 7 : js;
                          return !availableDays.includes(day);
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        type="button"
                        variant={
                          selectedSlot?.id === slot.id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {slot.start_time.substring(0, 5)}
                      </Button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Reason for appointment"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />

                  <Textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedSlot || !reason}
                  >
                    Confirm Booking
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default BookAppointment;
