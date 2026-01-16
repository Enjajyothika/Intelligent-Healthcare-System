import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, User, Activity, ShieldCheck, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_history: string | null;
  phone: string | null;
}

interface HealthMetric {
  id: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  recorded_at: string;
}

const DoctorPatientRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchHealthMetrics(selectedPatient.id);
    }
  }, [selectedPatient]);

  const checkAuthAndFetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/doctor/auth");
      return;
    }

    // Fetch the doctor's profile ID from doctor_profiles
    const { data: profile } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setDoctorId(profile.id);
      fetchMyPatients(profile.id);
    } else {
      setLoading(false);
    }
  };

  /**
   * PRIVACY ENFORCED FETCH
   * Only fetches patients who have a record in the appointments table 
   * associated with this specific doctor.
   */
  const fetchMyPatients = async (docId: string) => {
    setLoading(true);
    
    // Join appointments with patient_profiles to filter access
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        patient_id,
        patient_profiles (*)
      `)
      .eq("doctor_id", docId);

    if (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Access Error",
        description: "Could not verify patient relationships.",
        variant: "destructive",
      });
    } else {
      // Filter for unique patient profiles
      const uniquePatientsMap = new Map();
      data?.forEach((record: any) => {
        if (record.patient_profiles) {
          uniquePatientsMap.set(record.patient_profiles.id, record.patient_profiles);
        }
      });
      
      setPatients(Array.from(uniquePatientsMap.values()));
    }
    setLoading(false);
  };

  const fetchHealthMetrics = async (patientId: string) => {
    if (!doctorId) return;

    // Additional security check: Ensure the relationship still exists 
    // before fetching sensitive metrics
    const { data: relation } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientId)
      .limit(1);

    if (!relation || relation.length === 0) {
      toast({
        title: "Permission Denied",
        description: "You are not authorized to view this patient's metrics.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching metrics:", error);
    } else {
      setHealthMetrics((data as HealthMetric[]) || []);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = healthMetrics
    .slice(0, 7)
    .reverse()
    .map((m) => ({
      date: new Date(m.recorded_at).toLocaleDateString(),
      weight: m.weight_kg,
      bmi: m.bmi,
    }));

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/doctor/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Patient Records</h1>
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Privacy-Locked Access</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Patients</CardTitle>
              <CardDescription>Only patients you have consulted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading relationships...</p>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No records found.</p>
                    <p className="text-xs text-muted-foreground mt-1">Consulted patients will appear here.</p>
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-semibold">{patient.full_name}</p>
                      {patient.blood_group && (
                        <p className="text-sm opacity-80">{patient.blood_group}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            {selectedPatient ? (
              <Tabs defaultValue="info">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Patient Info</TabsTrigger>
                  <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{selectedPatient.full_name}</CardTitle>
                          <CardDescription>Verified Consultation Record</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold">Age</p>
                          <p className="text-sm text-muted-foreground">
                            {calculateAge(selectedPatient.date_of_birth)} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Gender</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPatient.gender || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Blood Group</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPatient.blood_group || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPatient.phone || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-2">Allergies</p>
                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          {selectedPatient.allergies || "None reported"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-2">Medical History</p>
                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          {selectedPatient.medical_history || "No history recorded"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Health Metrics</CardTitle>
                          <CardDescription>Historical Vital Trends</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {healthMetrics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No health metrics recorded for this patient
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 border rounded-lg bg-white shadow-sm">
                              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Weight</p>
                              <p className="text-2xl font-bold text-primary">
                                {healthMetrics[0].weight_kg || "--"}
                                {healthMetrics[0].weight_kg && <span className="text-sm ml-1">kg</span>}
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-white shadow-sm">
                              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Height</p>
                              <p className="text-2xl font-bold text-primary">
                                {healthMetrics[0].height_cm || "--"}
                                {healthMetrics[0].height_cm && <span className="text-sm ml-1">cm</span>}
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-white shadow-sm">
                              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">BMI</p>
                              <p className="text-2xl font-bold text-primary">
                                {healthMetrics[0].bmi || "--"}
                              </p>
                            </div>
                          </div>

                          {chartData.length > 1 && (
                            <div className="mt-8">
                              <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Health Progress Trends
                              </h3>
                              <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                                  <YAxis tick={{fontSize: 12}} />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Weight (kg)"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="bmi"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="BMI"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
                  <p>Select a patient to securely view records</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientRecords;