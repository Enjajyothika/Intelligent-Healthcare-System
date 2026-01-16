import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import {
  Calendar,
  MessageSquare,
  Clock,
  Pill,
  FileText,
  ClipboardList,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  // ---------- CHECK AUTH ----------
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/doctor/auth");
      return;
    }

    fetchDashboardData(session.user.id);
  };

  // ---------- FETCH DATA ----------
  const fetchDashboardData = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    setProfile(profileData);

    if (!profileData) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(
        `
        *,
        patient_profiles (full_name, phone)
      `
      )
      .eq("doctor_id", profileData.id)
      .gte("appointment_date", today)
      .order("appointment_date")
      .limit(5);

    setAppointments(appointmentsData || []);

    const { data: messagesData } = await supabase
      .from("messages")
      .select("id")
      .eq("receiver_id", userId)
      .is("read_at", null);

    setUnreadMessages(messagesData?.length || 0);
  };

  // ---------- SIGN OUT ----------
  const handleSignOut = async () => {
    await supabase.auth.signOut();

    toast({
      title: "Signed Out",
      description: "You have been logged out successfully.",
    });

    // Reset UI states immediately
    setProfile(null);
    setAppointments([]);
    setUnreadMessages(0);

    // Redirect instantly
    navigate("/doctor/auth");
  };

  // ---------- CARD STYLE ----------
  const card3D =
    "transform-gpu transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-xl";

  const glass =
    "bg-white/70 backdrop-blur-xl border border-blue-100 shadow-md rounded-2xl";

  const iconWrap =
    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Doctor Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, Dr. {profile?.full_name || "Doctor"}!
            </p>
          </div>

          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* CARD GRID */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-12">

          {/* APPOINTMENTS */}
          <div className={card3D} onClick={() => navigate("/doctor/appointments")}>
            <Card className={`${glass} p-6`}>
              <CardHeader className="flex items-center justify-between p-0 mb-4">
                <CardTitle className="text-lg font-semibold text-blue-700">
                  Appointments
                </CardTitle>
                <div className={`${iconWrap} bg-blue-100`}>
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700">{appointments.length}</p>
                <p className="text-sm text-gray-500">Today & upcoming</p>
              </CardContent>
            </Card>
          </div>

          {/* AVAILABILITY */}
          <div className={card3D} onClick={() => navigate("/doctor/availability")}>
            <Card className={`${glass} p-6`}>
              <CardHeader className="flex items-center justify-between p-0 mb-4">
                <CardTitle className="text-lg font-semibold text-cyan-700">
                  Availability
                </CardTitle>
                <div className={`${iconWrap} bg-cyan-100`}>
                  <Clock className="w-6 h-6 text-cyan-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-gray-700">Manage</p>
                <p className="text-sm text-gray-500">Weekly schedule</p>
              </CardContent>
            </Card>
          </div>

          {/* MESSAGES */}
          <div className={card3D} onClick={() => navigate("/doctor/messages")}>
            <Card className={`${glass} p-6`}>
              <CardHeader className="flex items-center justify-between p-0 mb-4">
                <CardTitle className="text-lg font-semibold text-purple-700">
                  Messages
                </CardTitle>
                <div className={`${iconWrap} bg-purple-100`}>
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-l text-black-700">Instant Messages</p>
                <p className="text-sm text-gray-500">Secure Chat</p>
              </CardContent>
            </Card>
          </div>

          {/* PRESCRIPTIONS */}
          <div className={card3D} onClick={() => navigate("/doctor/prescriptions")}>
            <Card className={`${glass} p-6`}>
              <CardHeader className="flex items-center justify-between p-0 mb-4">
                <CardTitle className="text-lg font-semibold text-rose-700">
                  Prescriptions
                </CardTitle>
                <div className={`${iconWrap} bg-rose-100`}>
                  <Pill className="w-6 h-6 text-rose-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-gray-700">Write</p>
                <p className="text-sm text-gray-500">Patient medications</p>
              </CardContent>
            </Card>
          </div>

          {/* PATIENT RECORDS */}
          <div className={card3D} onClick={() => navigate("/doctor/patients")}>
            <Card className={`${glass} p-6`}>
              <CardHeader className="flex items-center justify-between p-0 mb-4">
                <CardTitle className="text-lg font-semibold text-yellow-700">
                  Patient Records
                </CardTitle>
                <div className={`${iconWrap} bg-yellow-100`}>
                  <ClipboardList className="w-6 h-6 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-gray-700">View</p>
                <p className="text-sm text-gray-500">Health history</p>
              </CardContent>
            </Card>
          </div>

          {/* MEDICAL REPORTS */}
          <div className={card3D} onClick={() => navigate("/doctor/medical-reports")}>
            <Card className={`${glass} p-6`}>
              <CardHeader className="flex items-center justify-between p-0 mb-4">
                <CardTitle className="text-lg font-semibold text-emerald-700">
                  Medical Reports
                </CardTitle>
                <div className={`${iconWrap} bg-emerald-100`}>
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-gray-700">Manage</p>
                <p className="text-sm text-gray-500">Blockchain-secured</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* TODAY APPOINTMENTS */}
        {appointments.length > 0 && (
          <Card className={`${glass} p-6`}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-blue-800">
                Today's Appointments
              </CardTitle>
              <CardDescription>Your upcoming consultations</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex justify-between items-center p-4 bg-white/70 border rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-blue-700">
                        {apt.patient_profiles?.full_name}
                      </p>
                      <p className="text-gray-500 text-sm">{apt.reason}</p>
                      <p className="text-gray-500 text-sm">
                        {apt.patient_profiles?.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-700">
                        {new Date(apt.appointment_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      <span
                        className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                          apt.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : apt.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
