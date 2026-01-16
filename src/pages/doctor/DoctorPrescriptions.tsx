import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, FileText, Calendar, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DoctorProfile {
  id: string;
  full_name: string;
}

interface Patient {
  id: string;
  full_name: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  diagnosis: string | null;
  notes: string | null;
  status: string;
  prescribed_date: string;
  patient_profiles: {
    full_name: string;
  } | null;
}

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    patient_id: "",
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    diagnosis: "",
    notes: "",
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    if (doctorProfile) {
      fetchPrescriptions();
      fetchConsultedPatients();
    }
  }, [doctorProfile]);

  const fetchDoctorProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/doctor/auth");
      return;
    }

    const { data } = await supabase
      .from("doctor_profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setDoctorProfile(data);
    }
  };

  const fetchPrescriptions = async () => {
    if (!doctorProfile) return;

    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        patient_profiles (
          full_name
        )
      `)
      .eq("doctor_id", doctorProfile.id) // Restricted to this doctor
      .order("prescribed_date", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions",
        variant: "destructive",
      });
    } else {
      setPrescriptions(data || []);
    }
    setLoading(false);
  };

  /**
   * ADVANCED PRIVACY LOGIC:
   * Only fetch patients who have an appointment with this doctor.
   * This prevents doctors from seeing records of patients they haven't consulted.
   */
  const fetchConsultedPatients = async () => {
    if (!doctorProfile) return;

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        patient_id,
        patient_profiles (
          id,
          full_name
        )
      `)
      .eq("doctor_id", doctorProfile.id);

    if (error) {
      console.error("Error fetching linked patients:", error);
      return;
    }

    if (data) {
      // Extract unique patient profiles from the appointments
      const uniqueMap = new Map();
      data.forEach((item: any) => {
        if (item.patient_profiles) {
          uniqueMap.set(item.patient_profiles.id, item.patient_profiles);
        }
      });
      
      setPatients(Array.from(uniqueMap.values()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile) return;

    const { error } = await supabase.from("prescriptions").insert({
      doctor_id: doctorProfile.id,
      ...formData,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });
      setDialogOpen(false);
      setFormData({
        patient_id: "",
        medication_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        diagnosis: "",
        notes: "",
      });
      fetchPrescriptions();
    }
  };

  const updatePrescriptionStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("prescriptions")
      .update({ status })
      .eq("id", id)
      .eq("doctor_id", doctorProfile?.id); // Security: Ensure doctor owns the prescription

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update prescription",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Prescription updated",
      });
      fetchPrescriptions();
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) => filterStatus === "all" || p.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/doctor/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Prescription Management</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <p className="text-sm">Privacy-Enforced Access Enabled</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Prescription</DialogTitle>
                <DialogDescription>
                  You can only prescribe to patients who have booked a consultation with you.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="patient_id">Verified Patient</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patient_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={patients.length > 0 ? "Select patient" : "No consulted patients found"} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {patients.length === 0 && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      No patients found. Patients must book an appointment to appear here.
                    </p>
                  )}
                </div>
                {/* ... Medication Name, Dosage, Frequency, Duration inputs same as before ... */}
                <div>
                  <Label htmlFor="medication_name">Medication Name</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) =>
                      setFormData({ ...formData, medication_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      placeholder="e.g., 500mg"
                      value={formData.dosage}
                      onChange={(e) =>
                        setFormData({ ...formData, dosage: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      id="frequency"
                      placeholder="e.g., Twice daily"
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 7 days"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) =>
                      setFormData({ ...formData, diagnosis: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Special instructions for the patient"
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={patients.length === 0}>
                  Create Prescription
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ... Filter buttons and Prescription Cards same as before ... */}
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
                       <CardDescription>
                         Patient: {prescription.patient_profiles?.full_name}
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
                 <CardContent className="space-y-2">
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
                     <div>
                       <p className="text-muted-foreground text-sm">Diagnosis</p>
                       <p className="text-sm">{prescription.diagnosis}</p>
                     </div>
                   )}
                   <div className="flex gap-2 pt-4">
                     {prescription.status === "active" && (
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() =>
                           updatePrescriptionStatus(prescription.id, "completed")
                         }
                       >
                         Mark as Completed
                       </Button>
                     )}
                   </div>
                 </CardContent>
               </Card>
             ))}
             {filteredPrescriptions.length === 0 && (
               <Card>
                 <CardContent className="p-8 text-center text-muted-foreground">
                   No prescriptions found.
                 </CardContent>
               </Card>
             )}
           </div>
         )}
      </div>
    </div>
  );
};

export default DoctorPrescriptions;