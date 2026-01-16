import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatientProfile {
  id: string;
  full_name: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  diagnosis: string | null;
  status: string;
  prescribed_date: string;
  doctor_profiles: {
    full_name: string;
    specialization: string;
  } | null;
}

const PatientPrescriptions = () => {
  const navigate = useNavigate();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  useEffect(() => {
    if (patientProfile) {
      fetchPrescriptions();
      
      // Set up realtime subscription for prescription updates
      const channel = supabase
        .channel('prescription-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prescriptions',
            filter: `patient_id=eq.${patientProfile.id}`
          },
          () => {
            fetchPrescriptions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [patientProfile]);

  const fetchPatientProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/patient/auth");
      return;
    }

    const { data } = await supabase
      .from("patient_profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setPatientProfile(data);
    }
  };

  const fetchPrescriptions = async () => {
    if (!patientProfile) return;

    const { data } = await supabase
      .from("prescriptions")
      .select(`
        *,
        doctor_profiles (
          full_name,
          specialization
        )
      `)
      .eq("patient_id", patientProfile.id)
      .order("prescribed_date", { ascending: false });

    setPrescriptions(data || []);
    setLoading(false);
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) => filterStatus === "all" || p.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/patient/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Prescriptions</h1>
            <p className="text-muted-foreground">View your medical prescriptions</p>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            onClick={() => setFilterStatus("completed")}
          >
            Completed
          </Button>
        </div>

        {loading ? (
          <p>Loading prescriptions...</p>
        ) : (
          <div className="grid gap-4">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {prescription.medication_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <User className="h-4 w-4" />
                        Dr. {prescription.doctor_profiles?.full_name} -{" "}
                        {prescription.doctor_profiles?.specialization}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        prescription.status === "active"
                          ? "default"
                          : prescription.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {prescription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dosage</p>
                      <p className="font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium">{prescription.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{prescription.duration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prescribed</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(prescription.prescribed_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {prescription.diagnosis && (
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground text-sm font-medium">Diagnosis</p>
                      <p className="text-sm mt-1">{prescription.diagnosis}</p>
                    </div>
                  )}
                  {prescription.instructions && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-muted-foreground text-sm font-medium">Instructions</p>
                      <p className="text-sm mt-1">{prescription.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredPrescriptions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No prescriptions found
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions;
