import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PatientLogin from "@/components/patient/PatientLogin";
import PatientSignup from "@/components/patient/PatientSignup";

const PatientAuth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-primary mr-2" />
            <h1 className="text-3xl font-bold">Patient Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Access your health records and manage appointments
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <PatientLogin />
          </TabsContent>
          <TabsContent value="signup">
            <PatientSignup />
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default PatientAuth;
