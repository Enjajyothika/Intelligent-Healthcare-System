import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reason: string;
  patient_profiles: {
    full_name: string;
    phone: string | null;
  } | null;
}

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] =
    useState<"pending" | "today" | "upcoming" | "past" | "all">("pending");

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    initDoctor();
  }, []);

  useEffect(() => {
    if (doctorId) fetchAppointments();
  }, [doctorId, filter]);

  const initDoctor = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/doctor/auth");
      return;
    }

    const { data } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    setDoctorId(data.id);
  };

  /* ---------------- FETCH ---------------- */

  const fetchAppointments = async () => {
    if (!doctorId) return;
    setLoading(true);

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient_profiles (
          full_name,
          phone
        )
      `)
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: true });

    const now = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];

    if (filter === "pending") query = query.eq("status", "pending");
    if (filter === "today")
      query = query.gte("appointment_date", today).lt("appointment_date", `${today}T23:59:59`);
    if (filter === "upcoming") query = query.gte("appointment_date", now);
    if (filter === "past") query = query.lt("appointment_date", now);

    const { data } = await query;
    setAppointments(data || []);
    setLoading(false);
  };

  /* ---------------- ACTIONS ---------------- */

  const approveAppointment = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to approve", variant: "destructive" });
      return;
    }

    toast({ title: "Appointment approved" });
    fetchAppointments();
  };

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: "Cancelled by doctor",
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to cancel", variant: "destructive" });
      return;
    }

    toast({ title: "Appointment cancelled" });
    fetchAppointments();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "";
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen p-6">
      <Button variant="ghost" onClick={() => navigate("/doctor/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold my-6">Appointments</h1>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="mt-6">Loading...</p>
      ) : appointments.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No appointments</p>
      ) : (
        <div className="space-y-4 mt-6">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>
                      <User className="inline mr-2 h-4 w-4" />
                      {apt.patient_profiles?.full_name}
                    </CardTitle>
                    <CardDescription>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {new Date(apt.appointment_date).toLocaleDateString()}{" "}
                      <Clock className="inline h-3 w-3 ml-2 mr-1" />
                      {new Date(apt.appointment_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>

                  <Badge className={statusColor(apt.status)}>
                    {apt.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p><strong>Reason:</strong> {apt.reason}</p>

                {apt.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approveAppointment(apt.id)}
                    >
                      Approve
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => cancelAppointment(apt.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
