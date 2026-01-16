import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Clock } from "lucide-react";

/* ================= TYPES ================= */

interface DoctorProfile {
  id: string;
  full_name: string;
  specialization: string;
  other_specialization: string;
  license_number: string;
  experience_years: number | null;
  consultation_fee: number | null;
  is_available: boolean;
  bio: string | null;
  phone: string | null;
  education: string | null;
  languages: string[] | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  wallet_address: string;
}

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

/* ================= CONSTANTS ================= */

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Gynecologist",
  "Psychiatrist",
  "ENT Specialist",
  "Ophthalmologist",
  "General Physician",
  "Other",
];

/* ================= COMPONENT ================= */

const DoctorProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [languages, setLanguages] = useState("");
  const [licenseError, setLicenseError] = useState<string | null>(null);


  /* ================= METAMASK (MANUAL CONNECT ONLY) ================= */

const connectMetaMask = async () => {
  if (!(window as any).ethereum) {
    toast({
      title: "MetaMask not found",
      description: "Please install the MetaMask browser extension",
      variant: "destructive",
    });
    return;
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: "eth_requestAccounts", // ✅ opens MetaMask popup
    });

    if (accounts && accounts.length > 0) {
      setProfile((prev) =>
        prev ? { ...prev, wallet_address: accounts[0] } : prev
      );

      toast({
        title: "Wallet Connected",
        description: "MetaMask wallet connected successfully",
      });
    }
  } catch (error: any) {
    toast({
      title: "Connection Cancelled",
      description: error?.message || "User rejected MetaMask connection",
      variant: "destructive",
    });
  }
};

const deleteWallet = () => {
  setProfile((prev) =>
    prev ? { ...prev, wallet_address: "" } : prev
  );

  toast({
    title: "Wallet Removed",
    description: "MetaMask wallet has been removed from profile",
  });
};

  /* ================= VALIDATION ================= */

  const validateLicenseFormat = (v: string) => /^\d{10,15}$/.test(v);

  const checkLicenseUnique = async (
    license: string,
    doctorId: string
  ): Promise<boolean> => {
    const { data } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("license_number", license);

    if (!data || data.length === 0) return true;
    return data.every((row) => row.id === doctorId);
  };

  /* ================= INIT ================= */

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      navigate("/doctor/auth");
      return;
    }

    const { data: doctor } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (!doctor) return;

    setProfile({
      id: doctor.id,
      full_name: "",
      specialization: "",
      other_specialization: "",
      license_number: "",
      experience_years: null,
      consultation_fee: null,
      is_available: false,
      bio: "",
      phone: "",
      education: "",
      languages: [],
      clinic_address: "",
      clinic_phone: "",
      wallet_address: "",
    });

    setTimeSlots([]);
    setLanguages("");
    setLoading(false);
  };

  /* ================= SAVE PROFILE ================= */

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!validateLicenseFormat(profile.license_number)) {
      setLicenseError("License number must be 10–15 digits");
      return;
    }

    const unique = await checkLicenseUnique(
      profile.license_number,
      profile.id
    );

    if (!unique) {
      setLicenseError("This license number already exists");
      toast({
        title: "Duplicate License",
        description: "This medical license is already registered",
        variant: "destructive",
      });
      return;
    }
    if (!profile.wallet_address) {
  toast({
    title: "Wallet Required",
    description: "Please connect MetaMask before saving your profile",
    variant: "destructive",
  });
  return;
}

    const finalSpecialization =
      profile.specialization === "Other"
        ? profile.other_specialization
        : profile.specialization;

    const { error } = await supabase
      .from("doctor_profiles")
      .update({
        full_name: profile.full_name,
        specialization: finalSpecialization,
        license_number: profile.license_number,
        experience_years: profile.experience_years,
        consultation_fee: profile.consultation_fee,
        bio: profile.bio,
        phone: profile.phone,
        education: profile.education,
        clinic_address: profile.clinic_address,
        clinic_phone: profile.clinic_phone,
        wallet_address: profile.wallet_address,
        is_available: profile.is_available,
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
    }
  };

  /* ================= AVAILABILITY ================= */

  const addSlot = () => {
    setTimeSlots([
      ...timeSlots,
      {
        day_of_week: 0,
        start_time: "",
        end_time: "",
        is_available: true,
      },
    ]);
  };

  const updateSlot = (
    index: number,
    field: keyof TimeSlot,
    value: any
  ) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const removeSlot = async (index: number) => {
    const slot = timeSlots[index];
    if (slot.id) {
      await supabase.from("doctor_availability").delete().eq("id", slot.id);
    }
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    if (!profile) return;

    for (const slot of timeSlots) {
      if (slot.id) {
        await supabase
          .from("doctor_availability")
          .update(slot)
          .eq("id", slot.id);
      } else {
        await supabase.from("doctor_availability").insert({
          ...slot,
          doctor_id: profile.id,
        });
      }
    }

    toast({
      title: "Success",
      description: "Availability saved successfully",
    });
  };

  /* ================= RENDER ================= */

  if (loading || !profile) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Doctor Profile Setup</h1>

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
            <form onSubmit={saveProfile}>
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    All fields are empty by default. Fill carefully.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter full name"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Specialization</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={profile.specialization}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          specialization: e.target.value,
                          other_specialization: "",
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select specialization
                      </option>
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {profile.specialization === "Other" && (
                    <div>
                      <Label>Specify Specialization</Label>
                      <Input
                        placeholder="Enter specialization"
                        value={profile.other_specialization}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            other_specialization: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label>Medical License Number</Label>
                    <Input
                      placeholder="10–15 digit license number"
                      value={profile.license_number}
                      inputMode="numeric"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setProfile({ ...profile, license_number: v });
                        setLicenseError(
                          v && !validateLicenseFormat(v)
                            ? "License number must be 10–15 digits"
                            : null
                        );
                      }}
                      required
                    />
                    {licenseError && (
                      <p className="text-sm text-red-500 mt-1">
                        {licenseError}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 5"
                      value={profile.experience_years ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          experience_years: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                      
                      {/* Consultation Fee */}
<div>
  <Label>Consultation Fee (₹)</Label>
  <Input
    type="number"
    placeholder="e.g. 500"
    value={profile.consultation_fee ?? ""}
    onChange={(e) =>
      setProfile({
        ...profile,
        consultation_fee: Number(e.target.value),
      })
    }
    required
  />
</div>

{/* Clinic Address */}
<div>
  <Label>Clinic Address</Label>
  <Textarea
    placeholder="Enter full clinic address"
    value={profile.clinic_address || ""}
    onChange={(e) =>
      setProfile({
        ...profile,
        clinic_address: e.target.value,
      })
    }
    required
  />
</div>

{/* Clinic Phone Number */}
<div>
  <Label>Clinic Contact Number</Label>
  <Input
    type="tel"
    placeholder="e.g. +91 9876543210"
    value={profile.clinic_phone || ""}
    onChange={(e) =>
      setProfile({
        ...profile,
        clinic_phone: e.target.value,
      })
    }
    required
  />
</div>

                  <div>
                    <Label>Education</Label>
                    <Textarea
                      placeholder="MBBS, MD – University name"
                      value={profile.education || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, education: e.target.value })
                      }
                    />
                  </div>
                     
                  <div>
                    <Label>Professional Bio</Label>
                    <Textarea
                      placeholder="Brief professional description"
                      value={profile.bio || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Languages</Label>
                    <Input
                      placeholder="English, Hindi, Tamil"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
  <Label>Wallet (MetaMask)</Label>

  {profile.wallet_address ? (
    <div className="flex items-center justify-between border p-3 rounded-md">
      <span className="text-sm break-all">
        {profile.wallet_address}
      </span>
      <Button
  type="button"
  variant="destructive"
  onClick={deleteWallet}
>
  Delete Wallet
</Button>

    </div>
  ) : (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={connectMetaMask}
    >
      Connect MetaMask
    </Button>
  )}
</div>


                  <div className="flex items-center justify-between">
                    <Label>Currently Available</Label>
                    <Switch
                      checked={profile.is_available}
                      onCheckedChange={(v) =>
                        setProfile({ ...profile, is_available: v })
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
          
          {/* AVAILABILITY */}
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 border p-4 rounded-lg"
                  >
                    <select
                      value={slot.day_of_week}
                      onChange={(e) =>
                        updateSlot(
                          index,
                          "day_of_week",
                          Number(e.target.value)
                        )
                      }
                    >
                      {DAYS.map((d, i) => (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) =>
                        updateSlot(index, "start_time", e.target.value)
                      }
                    />

                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) =>
                        updateSlot(index, "end_time", e.target.value)
                      }
                    />

                    <Switch
                      checked={slot.is_available}
                      onCheckedChange={(v) =>
                        updateSlot(index, "is_available", v)
                      }
                    />

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSlot(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" onClick={addSlot}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Slot
                </Button>

                <Button onClick={saveAvailability}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Availability
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate("/doctor/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default DoctorProfileSetup;
