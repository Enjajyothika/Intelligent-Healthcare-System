import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Plus, FileText, Download, ShieldCheck, AlertCircle, Eye, CheckCircle2, Loader2, ShieldAlert 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ---------------- CRYPTO HELPER ---------------- */

// SHA-256 binary hashing to ensure the file hasn't changed since upload
const generateFileHash = async (file: Blob): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/* ---------------- COMPONENT ---------------- */

const DoctorMedicalReports = () => {
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI & Processing States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Preview States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<any>(null);

  const [formData, setFormData] = useState({
    patient_id: "",
    title: "",
    report_type: "Lab Report",
    report_date: new Date().toISOString().split('T')[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/doctor/auth");

    const { data: profile } = await supabase
      .from("doctor_profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setDoctorProfile(profile);
      await fetchAuthorizedData(profile.id);
    }
  };

  // PRIVACY GATE: Only patients who have consulted this doctor
  const fetchAuthorizedData = async (docId: string) => {
    setLoading(true);
    try {
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`patient_id, patient_profiles(id, full_name)`)
        .eq("doctor_id", docId);

      if (appointments) {
        const authIds = appointments.map(a => a.patient_id);
        const uniquePatients = Array.from(new Map(appointments.map(a => [a.patient_id, a.patient_profiles])).values());
        setPatients(uniquePatients as any);

        if (authIds.length > 0) {
          const { data: authReports } = await supabase
            .from("medical_reports")
            .select(`*, patient_profiles(full_name)`)
            .in("patient_id", authIds)
            .order("created_at", { ascending: false });
          
          setReports(authReports || []);
        }
      }
    } catch (err) {
      console.error("Access error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SECURE FILE ACTIONS ---------------- */

  const handleFileAction = async (report: any, action: 'view' | 'download') => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.storage
        .from("medical-reports")
        .download(report.file_path);

      if (error) throw error;

      // RE-CALCULATE HASH TO VERIFY INTEGRITY (Blockchain-style)
      const currentHash = await generateFileHash(data);
      
      if (currentHash !== report.hash) {
        toast({
          title: "Integrity Violation!",
          description: "Cryptographic hash mismatch. This file is potentially compromised.",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(data);
      if (action === 'view') {
        setPreviewUrl(url);
        setActiveReport(report);
        setViewDialogOpen(true);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = report.title || "medical_report";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast({ title: "Verification Failed", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile || !selectedFile) return;

    setUploading(true);
    try {
      const fileHash = await generateFileHash(selectedFile);
      const fileName = `${formData.patient_id}/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage.from("medical-reports").upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("medical_reports").insert({
        ...formData,
        uploaded_by_doctor_id: doctorProfile.id,
        file_path: fileName,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        hash: fileHash,
        is_verified: true,
      });

      if (dbError) throw dbError;

      toast({ title: "Report Secured", description: "Hash registered in medical ledger." });
      setDialogOpen(false);
      fetchAuthorizedData(doctorProfile.id);
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/doctor/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-bold">Medical Reports (Doctor)</h1>
            <p className="text-xs text-green-600 font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> SECURE INTEGRITY MODE
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={patients.length === 0}><Plus className="mr-2 h-4 w-4" /> Upload Report</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Secure Report Upload</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <Label>Verified Patient</Label>
                <Select onValueChange={(v) => setFormData({...formData, patient_id: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <Label>File Selection</Label>
                <Input type="file" required onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? "Hashing..." : "Upload Secured Document"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? <p className="italic">Verifying patient relationships...</p> : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-l-4 border-l-blue-600">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" /> {report.title}
                    </h3>
                    <p className="text-sm text-slate-500">Patient: {report.patient_profiles?.full_name}</p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">SHA-256: {report.hash}</div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1" onClick={() => handleFileAction(report, 'view')}><Eye className="h-4 w-4 mr-2" /> View</Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleFileAction(report, 'download')}><Download className="h-4 w-4 mr-2" /> Download</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && <p className="text-center py-20 text-slate-400">No consulted patients have reports yet.</p>}
          </div>
        )}

        {/* VERIFIED PREVIEW */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Content Integrity Verified</DialogTitle>
            </DialogHeader>
            <div className="flex-1 bg-slate-100 rounded overflow-hidden border">
              {activeReport?.file_type?.includes('pdf') ? (
                <iframe src={previewUrl || ""} className="w-full h-full" title="PDF" />
              ) : activeReport?.file_type?.includes('image') ? (
                <img src={previewUrl || ""} className="w-full h-full object-contain" alt="Medical Scan" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full"><ShieldAlert className="h-10 w-10 text-yellow-500" /><p>Preview not supported.</p></div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default DoctorMedicalReports;