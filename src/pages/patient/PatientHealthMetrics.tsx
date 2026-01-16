import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowLeft, Activity } from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface HealthMetric {
  id: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  recorded_at: string;
}

const PatientHealthMetrics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    weight_kg: "",
    height_cm: "",
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/patient/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile) {
      setPatientId(profile.id);
      fetchMetrics(profile.id);
    } else {
      toast({
        title: "Profile Missing",
        description: "Please complete your profile first.",
        variant: "destructive",
      });
    }
  };

  const fetchMetrics = async (patientId: string) => {
    setLoading(true);

    const { data } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false });

    setMetrics(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) return;

    const weight = parseFloat(formData.weight_kg);
    const height = parseFloat(formData.height_cm);
    const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(2) : null;

    await supabase.from("health_metrics").insert({
      patient_id: patientId,
      weight_kg: weight,
      height_cm: height,
      bmi: bmi ? parseFloat(bmi) : null,
    });

    toast({
      title: "Saved Successfully",
      description: "Your health metrics have been updated.",
    });

    setFormData({ weight_kg: "", height_cm: "" });
    fetchMetrics(patientId);
  };

  const getAIHealthAnalysis = (bmi: number | null) => {
    if (!bmi) return null;

    if (bmi < 18.5)
      return {
        status: "Underweight",
        color: "text-blue-600",
        diet: ["Increase calorie intake", "Eat nuts & seeds", "Protein smoothies"],
        lifestyle: ["Strength training", "Do not skip meals", "Eat more frequently"],
        risks: ["Weak immunity", "Nutrient deficiency", "Low energy"],
      };

    if (bmi < 25)
      return {
        status: "Healthy Weight",
        color: "text-green-600",
        diet: ["Balanced meals", "2–3L water", "Moderate protein"],
        lifestyle: ["Exercise 30 mins", "7–8 hrs sleep", "Stress control"],
        risks: ["Low risk — maintain this!"],
      };

    if (bmi < 30)
      return {
        status: "Overweight",
        color: "text-yellow-600",
        diet: ["Reduce sugar", "Increase fiber", "Avoid fried foods"],
        lifestyle: ["Walk 45 mins", "Avoid long sitting", "Yoga / low impact"],
        risks: ["Diabetes risk", "High BP", "Joint strain"],
      };

    return {
      status: "Obese",
      color: "text-red-600",
      diet: ["Avoid junk food", "Low calorie diet", "More vegetables"],
      lifestyle: ["Walk 1 hour daily", "Supervised exercise", "Track calories"],
      risks: ["Heart disease", "Diabetes", "Fatty liver"],
    };
  };

  const ai = metrics.length > 0 ? getAIHealthAnalysis(metrics[0].bmi) : null;

  const chartData = metrics.slice(0, 10).reverse().map((m) => ({
    date: new Date(m.recorded_at).toLocaleDateString(),
    weight: m.weight_kg,
    bmi: m.bmi,
  }));

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto">

        <Button variant="ghost" onClick={() => navigate("/patient/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="text-4xl font-bold mb-10 bg-gradient-primary text-transparent bg-clip-text">
          Health Metrics
        </h1>

        {/* ----------- 2×2 GRID REORDERED ----------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1 — Add New Metrics */}
          <Card className="shadow-lg bg-white/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Add New Metrics</CardTitle>
              <CardDescription>Enter your latest health details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {formData.weight_kg && formData.height_cm && (
                  <div className="p-3 rounded bg-blue-50 border text-sm">
                    <span className="font-semibold">BMI: </span>
                    {(
                      parseFloat(formData.weight_kg) /
                      Math.pow(parseFloat(formData.height_cm) / 100, 2)
                    ).toFixed(2)}
                  </div>
                )}

                <Button className="w-full">Save Metrics</Button>
              </form>
            </CardContent>
          </Card>

          {/* 2 — Latest Metrics */}
          <Card className="shadow-lg bg-white/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Latest Metrics</CardTitle>
              <CardDescription>Your recent health data</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : metrics.length === 0 ? (
                <p className="text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="flex items-center"><Activity className="mr-2 h-4 w-4" /> Weight</span>
                    <span className="font-semibold">{metrics[0].weight_kg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Height</span>
                    <span className="font-semibold">{metrics[0].height_cm} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BMI</span>
                    <span className="font-semibold">{metrics[0].bmi}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(metrics[0].recorded_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3 — AI Analysis */}
          <Card className="shadow-lg bg-white/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>AI Health Analysis</CardTitle>
              <CardDescription>Smart recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {!ai ? (
                <p className="text-muted-foreground text-sm">Add metrics to see analysis</p>
              ) : (
                <div className="space-y-6">
                  <div className="p-3 rounded bg-green-50 border">
                    <p className="text-lg font-semibold">
                      Status: <span className={ai.color}>{ai.status}</span>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-700 mb-1">Diet Recommendations</h3>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      {ai.diet.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-700 mb-1">Lifestyle Suggestions</h3>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      {ai.lifestyle.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-red-700 mb-1">Possible Risks</h3>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      {ai.risks.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4 — Metrics Chart */}
          <Card className="shadow-lg bg-white/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Health Trend Chart</CardTitle>
              <CardDescription>Track your progress visually</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground">No chart data</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#0284c7" name="Weight (kg)" />
                    <Line type="monotone" dataKey="bmi" stroke="#14b8a6" name="BMI" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default PatientHealthMetrics;
