import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1️⃣ Login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new Error("INVALID_CREDENTIALS");
      }

      // 2️⃣ Check doctor role
      const { data: doctorProfile } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // 3️⃣ If NOT a doctor → block
      if (!doctorProfile) {
        await supabase.auth.signOut();
        throw new Error("NOT_DOCTOR");
      }

      // 4️⃣ Success
      navigate("/doctor/dashboard");

    } catch (err: any) {
      if (err.message === "NOT_DOCTOR") {
        setErrorMessage("This account is not registered as a doctor.");
      } else {
        setErrorMessage("Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 mt-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-accent"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      {/* 🔴 Error message BELOW button */}
      {errorMessage && (
        <p className="text-sm text-red-600 text-center mt-2">
          {errorMessage}
        </p>
      )}
    </form>
  );
};

export default DoctorLogin;
