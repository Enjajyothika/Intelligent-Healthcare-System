import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";

const DoctorSignup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const connectWallet = async () => {
    try {
      if (typeof (window as any).ethereum !== "undefined") {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        toast({
          title: "Wallet connected!",
          description: "Your wallet has been connected successfully.",
        });
      } else {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to continue.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: "Wallet required",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/doctor/profile-setup`,
          data: {
            full_name: fullName,
            user_type: "doctor",
            wallet_address: walletAddress,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please complete your profile to continue.",
      });

      navigate("/doctor/profile-setup");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 mt-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Dr. Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label>Wallet Address</Label>
        {walletAddress ? (
          <div className="p-3 bg-success/10 border border-success rounded-md text-sm text-success break-all">
            {walletAddress}
          </div>
        ) : (
          <Button
            type="button"
            onClick={connectWallet}
            variant="outline"
            className="w-full"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect MetaMask Wallet
          </Button>
        )}
      </div>
      <Button
        type="submit"
        className="w-full bg-accent"
        disabled={isLoading || !walletAddress}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
};

export default DoctorSignup;
