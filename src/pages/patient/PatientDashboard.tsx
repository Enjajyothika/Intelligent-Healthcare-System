import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import {
  User,
  Activity,
  Calendar,
  Bot,
  FileText,
  Pill,
  MessageCircle,
} from "lucide-react";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      navigate("/patient/auth");
    }
  };

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profileData } = await supabase
      .from("patient_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setProfile(profileData);

    if (profileData) {
      const { data: metricsData } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("patient_id", profileData.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      setMetrics(metricsData);

      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select(`
          *,
          doctor_profiles (full_name, specialization)
        `)
        .eq("patient_id", profileData.id)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date");

      setAppointments(appointmentsData || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const card3D =
    "transition-all transform-gpu hover:scale-[1.03] hover:-translate-y-2 duration-500 hover:shadow-xl";

  const glass =
    "bg-white/70 backdrop-blur-xl border border-blue-100 shadow-md rounded-2xl";

  const iconWrapper =
    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Patient Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {profile?.full_name || "Patient"}!
            </p>
          </div>

          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* FEATURE GRID */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-12">

          {/* 1 — Profile */}
          <div className={card3D} onClick={() => navigate("/patient/profile")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-blue-100`}>
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-blue-800">My Profile</h2>
              </div>

              <p className="text-gray-600 text-sm">Manage information</p>
            </div>
          </div>

          {/* 2 — Metrics */}
          <div className={card3D} onClick={() => navigate("/patient/health-metrics")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-cyan-100`}>
                  <Activity className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-lg font-semibold text-cyan-800">Health Metrics</h2>
              </div>

              {metrics ? (
                <p className="text-gray-700 text-sm">Weight: {metrics.weight_kg} kg</p>
              ) : (
                <p className="text-gray-500 text-sm">No recent measurements</p>
              )}
            </div>
          </div>

          {/* 3 — Appointments */}
          <div className={card3D} onClick={() => navigate("/patient/book-appointment")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-blue-100`}>
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-blue-800">Appointments</h2>
              </div>

              <p className="text-gray-600 text-sm mb-1">Schedule doctor visits</p>
              <p className="text-blue-700 font-medium text-sm">
                {appointments.length} upcoming
              </p>
            </div>
          </div>

          {/* 4 — AI Symptoms */}
          <div className={card3D} onClick={() => navigate("/patient/symptoms-analyzer")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-purple-100`}>
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-purple-800">AI Symptoms</h2>
              </div>

              <p className="text-gray-600 text-sm">Analyze symptoms instantly</p>
            </div>
          </div>

          {/* 5 — Reports */}
          <div className={card3D} onClick={() => navigate("/patient/medical-reports")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-emerald-100`}>
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-800">Medical Reports</h2>
              </div>

              <p className="text-gray-600 text-sm">Blockchain protected</p>
            </div>
          </div>

          {/* 6 — Prescriptions */}
          <div className={card3D} onClick={() => navigate("/patient/prescriptions")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-rose-100`}>
                  <Pill className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-lg font-semibold text-rose-800">Prescriptions</h2>
              </div>

              <p className="text-gray-600 text-sm">Digital prescriptions</p>
            </div>
          </div>

          {/* 7 — Messaging */}
          <div className={card3D} onClick={() => navigate("/patient/messaging")}>
            <div className={`${glass} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${iconWrapper} bg-indigo-100`}>
                  <MessageCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-indigo-800">Message Doctor</h2>
              </div>

              <p className="text-gray-600 text-sm">Instant communication</p>
            </div>
          </div>
        </div>

        {/* APPOINTMENTS SECTION */}
        {appointments.length > 0 && (
          <div className={`${glass} p-6`}>
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Upcoming Appointments
            </h2>

            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/70 backdrop-blur border"
                >
                  <div>
                    <p className="font-semibold text-blue-700">
                      {apt.doctor_profiles?.full_name}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {apt.doctor_profiles?.specialization}
                    </p>
                    <p className="text-sm mt-1">{apt.reason}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm">{new Date(apt.appointment_date).toLocaleDateString()}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(apt.appointment_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <span className="inline-block mt-2 bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded">
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDashboard;
