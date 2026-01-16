import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Download, Shield, Clock, Eye, Upload, Plus, ShieldCheck, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ---------------- CRYPTO HELPER ---------------- */

// SHA-256 binary hashing for blockchain-like file integrity
const generateFileHash = async (file: Blob): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/* ---------------- COMPONENT ---------------- */

const PatientMedicalReports = () => {
  const navigate = useNavigate();
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Preview States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    report_type: "General",
    report_date: new Date().toISOString().split("T")[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  useEffect(() => {
    if (patientProfile) fetchReports();
  }, [patientProfile]);

  const fetchPatientProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/patient/auth");
    const { data } = await supabase.from("patient_profiles").select("id, full_name, user_id").eq("user_id", user.id).single();
    if (data) setPatientProfile(data);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("medical_reports")
      .select(`*, doctor_profiles(full_name, specialization)`)
      .eq("patient_id", patientProfile.id)
      .order("created_at", { ascending: false });

    if (!error) setReports(data || []);
    setLoading(false);
  };

  /* ---------------- SECURE ACTIONS ---------------- */

  const handleFileAction = async (report: any, action: 'view' | 'download') => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.storage.from("medical-reports").download(report.file_path);
      if (error) throw error;

      // VERIFY INTEGRITY (SHA-256 Check)
      const currentHash = await generateFileHash(data);
      
      if (currentHash !== report.hash) {
        toast({
          title: "Integrity Violation!",
          description: "This file does not match its original security hash.",
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
        a.download = report.title;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast({ title: "Error", description: "Verification failed.", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientProfile || !selectedFile) return;

    setUploading(true);
    try {
      const fileHash = await generateFileHash(selectedFile);
      const filePath = `${patientProfile.user_id}/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage.from("medical-reports").upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("medical_reports").insert({
        patient_id: patientProfile.id,
        title: formData.title,
        description: formData.description || null,
        report_type: formData.report_type,
        report_date: formData.report_date,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        hash: fileHash,
        is_verified: true,
      });

      if (dbError) throw dbError;
      toast({ title: "Success", description: "Report secured in your medical vault." });
      setDialogOpen(false);
      fetchReports();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/patient/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-3xl font-bold">My Medical Vault</h1>
            <p className="text-xs text-blue-600 font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> END-TO-END INTEGRITY PROTECTION
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Add Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Secure Vault Upload</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <Label>Title</Label>
                <Input required placeholder="e.g. June Blood Test" onChange={e => setFormData({...formData, title: e.target.value})} />
                <Label>Report Type</Label>
                <Select onValueChange={(v) => setFormData({...formData, report_type: v})} defaultValue="General">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lab Report">Lab Report</SelectItem>
                    <SelectItem value="X-Ray">X-Ray</SelectItem>
                    <SelectItem value="Prescription">Prescription</SelectItem>
                  </SelectContent>
                </Select>
                <Label>File Selection</Label>
                <Input type="file" required onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                <Button className="w-full" disabled={uploading}>{uploading ? "Securing..." : "Store in Vault"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? <p>Loading secure records...</p> : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" /> {report.title}
                    </h3>
                    <div className="mt-1 text-[10px] font-mono text-slate-400">HASH: {report.hash}</div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => handleFileAction(report, 'view')}><Eye className="h-4 w-4 mr-1" /> View</Button>
                    <Button variant="outline" size="sm" onClick={() => handleFileAction(report, 'download')}><Download className="h-4 w-4 mr-1" /> Download</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* SECURE PREVIEW */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" /> Data Integrity Verified
              </DialogTitle>
            </div>
            <div className="flex-1 bg-slate-100 overflow-hidden relative">
              {activeReport?.file_type?.includes('pdf') ? (
                <iframe src={previewUrl || ""} className="w-full h-full" title="Verified PDF" />
              ) : activeReport?.file_type?.includes('image') ? (
                <img src={previewUrl || ""} className="w-full h-full object-contain" alt="Verified Image" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full"><ShieldAlert className="h-10 w-10 text-yellow-500" /><p>No preview available.</p></div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default PatientMedicalReports;