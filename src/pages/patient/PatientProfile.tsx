import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User } from "lucide-react";

interface PatientProfile {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_history: string | null;
}

const PatientProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    blood_group: "",
    allergies: "",
    medical_history: "",
  });

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/patient/auth");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("patient_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        date_of_birth: data.date_of_birth || "",
        gender: data.gender || "",
        phone: data.phone || "",
        address: data.address || "",
        blood_group: data.blood_group || "",
        allergies: data.allergies || "",
        medical_history: data.medical_history || "",
      });
    } else {
      toast({
        title: "Profile not found",
        description: "Please contact support",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        phone: formData.phone || null,
        address: formData.address || null,
        blood_group: formData.blood_group || null,
        allergies: formData.allergies || null,
        medical_history: formData.medical_history || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/patient/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Patient Profile</CardTitle>
                <CardDescription>Manage your personal and medical information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Your full address..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Medical Information</h3>
                
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select value={formData.blood_group} onValueChange={(value) => setFormData({ ...formData, blood_group: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="List any known allergies..."
                  />
                </div>

                <div>
                  <Label htmlFor="medical_history">Medical History</Label>
                  <Textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    placeholder="Previous conditions, surgeries, medications..."
                    rows={5}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfile;