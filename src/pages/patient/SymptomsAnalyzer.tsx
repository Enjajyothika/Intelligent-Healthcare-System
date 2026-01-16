import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { 
  Heart, Bone, Brain, User, Baby, Activity, 
  Stethoscope, Info, ArrowRight, Mic, MicOff, Loader2, Apple, Dumbbell, Sparkles, Smile, Eye, Ear, UserPlus, Languages, Volume2, VolumeX, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ... (specialtyFields and languages arrays remain the same)
const specialtyFields = [
  { id: "General Physician", display: "Fever & Infection", icon: <User className="text-blue-500 h-8 w-8" />, description: "Fever, Infections, or General Unwellness", symptoms: ["High Fever", "Persistent Fatigue", "Body Aches", "Unexplained Weight Loss", "Night Sweats", "Swollen Glands", "Loss of Appetite"] },
  { id: "Cardiologist", display: "Heart & Chest", icon: <Heart className="text-red-500 h-8 w-8" />, description: "Heart Health and Chest Concerns", symptoms: ["Chest Pain", "Heart Palpitations", "Shortness of Breath", "High Blood Pressure", "Swelling in Ankles", "Fainting", "Dizziness"] },
  { id: "Dermatologist", display: "Skin & Hair", icon: <Activity className="text-emerald-500 h-8 w-8" />, description: "Skin, Hair, and Nail Issues", symptoms: ["Persistent Rashes", "New/Changing Moles", "Severe Acne", "Itching/Burning Skin", "Hair Loss", "Nail Discoloration", "Hives"] },
  { id: "Neurologist", display: "Brain & Nerves", icon: <Brain className="text-purple-500 h-8 w-8" />, description: "Brain, Nerves, and Chronic Headaches", symptoms: ["Chronic Migraines", "Seizures", "Numbness/Tingling", "Confusion", "Memory Loss", "Loss of Balance", "Muscle Tremors"] },
  { id: "Orthopedic Surgeon", display: "Bones & Joints", icon: <Bone className="text-orange-500 h-8 w-8" />, description: "Bones, Joints, and Physical Injuries", symptoms: ["Joint Pain", "Severe Back Pain", "Knee Swelling", "Bone Fractures", "Stiffness", "Muscle Weakness", "Sports Injury"] },
  { id: "Pediatrician", display: "Child Health", icon: <Smile className="text-yellow-500 h-8 w-8" />, description: "Child Health (Ages 0-18)", symptoms: ["Childhood Fever", "Developmental Concerns", "Behavioral Changes", "Pediatric Rashes", "Poor Growth", "Recurrent Ear Infections", "Vomiting/Diarrhea"] },
  { id: "Gynecologist", display: "Women's Health", icon: <Baby className="text-pink-500 h-8 w-8" />, description: "Women's Health and Pregnancy", symptoms: ["Menstrual Pain", "Irregular Periods", "Pelvic Pain", "Pregnancy Care", "Hormonal Issues", "Breast Lumps", "PCOS/PCOD"] },
  { id: "Psychiatrist", display: "Mental Health", icon: <Activity className="text-indigo-500 h-8 w-8" />, description: "Mental Health and Mood", symptoms: ["Severe Anxiety", "Persistent Depression", "Insomnia", "Panic Attacks", "Mood Swings", "Hallucinations", "Suicidal Thoughts"] },
  { id: "ENT Specialist", display: "Ear, Nose, Throat", icon: <Ear className="text-cyan-500 h-8 w-8" />, description: "Ear, Nose, and Throat Problems", symptoms: ["Hearing Loss", "Tinnitus (Ringing)", "Sinus Pressure", "Chronic Sore Throat", "Hoarseness", "Nasal Polyps", "Vertigo"] },
  { id: "Ophthalmologist", display: "Eyes & Vision", icon: <Eye className="text-teal-500 h-8 w-8" />, description: "Eye Exams and Vision Disorders", symptoms: ["Blurred Vision", "Eye Pain", "Sudden Vision Loss", "Floaters/Flashes", "Redness/Inflammation", "Double Vision", "Light Sensitivity"] },
  { id: "General Help", display: "Other / Unsure", icon: <UserPlus className="text-slate-500 h-8 w-8" />, description: "I don't know which section to choose", symptoms: ["Chronic Pain", "Sleep Issues", "Autoimmune Concerns", "Allergies", "Hormonal Imbalance", "Metabolic Issues", "General Weakness"] }
];

const languages = [
  { label: "English", code: "en-US" },
  { label: "हिन्दी (Hindi)", code: "hi-IN" },
  { label: "తెలుగు (Telugu)", code: "te-IN" },
  { label: "ಕನ್ನಡ (Kannada)", code: "kn-IN" }
];

export default function SymptomsAnalyzer() {
  const navigate = useNavigate(); 
  const { toast } = useToast();
  const synthesisRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  const [step, setStep] = useState(1);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [checkedSymptoms, setCheckedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [userSeverity, setUserSeverity] = useState("Moderate"); // New state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    return () => synthesisRef.current?.cancel();
  }, []);

  const stopAudio = () => {
    synthesisRef.current?.cancel();
    setIsSpeaking(false);
  };

  const speakResults = (text: string) => {
    if (!text || !synthesisRef.current) return;
    stopAudio();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthesisRef.current.speak(utterance);
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice input not supported", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang;
    recognition.onstart = () => { setIsListening(true); stopAudio(); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setDescription(prev => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleAnalysis = async () => {
    const allSymptoms = [...checkedSymptoms, description].filter(Boolean);
    if (allSymptoms.length === 0) return toast({ title: "Please provide symptoms", variant: "destructive" });

    setIsAnalyzing(true);
    setStep(3);
    stopAudio();

    try {
      const langLabel = languages.find(l => l.code === selectedLang)?.label;
      const prompt = `
        Analyze: ${allSymptoms.join(", ")}. 
        User's reported severity level: ${userSeverity}.
        Context: ${selectedField.id}.
        
        REQUIRED OUTPUT:
        1. A SHORT summary (MAX 2 sentences) in ${langLabel}.
        2. Clinical Severity: High/Medium/Low.
        3. Identify exact specialist needed.
        
        Return ONLY valid JSON:
        {
          "possibilities": "explanation",
          "severity": "High/Medium/Low",
          "specialist": "Doctor Type",
          "diet": ["item1", "item2"],
          "exercise": ["tip1", "tip2"]
        }
      `;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const rawResponse = data.candidates[0].content.parts[0].text;
      const cleanJson = JSON.parse(rawResponse.replace(/```json|```/g, ""));
      
      setResult(cleanJson);
      setTimeout(() => speakResults(cleanJson.possibilities), 600);
      
    } catch (err) {
      toast({ title: "Analysis failed", variant: "destructive" });
      setStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => { stopAudio(); step === 1 ? navigate(-1) : setStep(step - 1); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white border px-3 py-1 rounded-lg shadow-sm">
                <Languages className="h-4 w-4 text-slate-400" />
                <Select value={selectedLang} onValueChange={(v) => { setSelectedLang(v); stopAudio(); }}>
                    <SelectTrigger className="w-[120px] border-none h-8 shadow-none focus:ring-0 text-xs font-semibold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                    </SelectContent>
                </Select>
             </div>
             <div className="flex items-center gap-2 text-primary font-bold">
               <Sparkles className="h-5 w-5" /> AI Diagnostics
             </div>
          </div>
        </div>

        {/* STEP 1: Categories */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-3xl font-bold text-slate-800">Identify the Concern</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialtyFields.map((field) => (
                <Card 
                  key={field.id} 
                  className="cursor-pointer hover:border-primary transition-all border-2 group shadow-sm"
                  onClick={() => { setSelectedField(field); setStep(2); }}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className="p-4 bg-slate-100 rounded-full group-hover:bg-primary/10 transition-colors">
                      {field.icon}
                    </div>
                    <CardTitle className="text-lg">{field.display}</CardTitle>
                    <CardDescription className="text-xs">{field.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Symptoms & Severity Selection */}
        {step === 2 && selectedField && (
          <Card className="border-t-4 border-t-primary shadow-xl animate-in slide-in-from-right-4 overflow-hidden">
            <CardHeader className="bg-white">
              <CardTitle className="flex items-center gap-3">
                {selectedField.icon} Describe Your {selectedField.display} Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-6 md:p-8">
              {/* Checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedField.symptoms.map((s: string) => (
                  <div key={s} className="flex items-center space-x-2 bg-white p-3 rounded-lg border hover:border-primary/30 transition-colors">
                    <Checkbox id={s} onCheckedChange={(c) => setCheckedSymptoms(prev => c ? [...prev, s] : prev.filter(x => x !== s))} />
                    <Label htmlFor={s} className="text-sm cursor-pointer font-medium">{s}</Label>
                  </div>
                ))}
              </div>

              {/* Severity Selector (NEW SECTION) */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-bold text-slate-700">How severe is your discomfort?</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Mild", color: "bg-green-600 hover:bg-green-700 border-green-700" },
                    { label: "Moderate", color: "bg-orange-500 hover:bg-orange-600 border-orange-600" },
                    { label: "Severe", color: "bg-red-600 hover:bg-red-700 border-red-700" }
                  ].map((level) => (
                    <Button
                      key={level.label}
                      type="button"
                      variant={userSeverity === level.label ? "default" : "outline"}
                      className={`h-12 rounded-xl border-2 transition-all font-bold ${
                        userSeverity === level.label ? level.color + " text-white" : "bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => setUserSeverity(level.label)}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Voice/Textarea */}
              <div className="space-y-3 pt-6 border-t">
                <div className="flex justify-between items-center">
                    <Label className="font-bold text-slate-700">Detailed Description</Label>
                    <Button 
                        variant={isListening ? "destructive" : "secondary"} 
                        size="sm" 
                        onClick={startSpeechRecognition} 
                        className={isListening ? "animate-pulse" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}
                    >
                        {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                        {isListening ? "Listening..." : "Speak Symptoms"}
                    </Button>
                </div>
                <Textarea 
                  placeholder="How long has this been happening? Where exactly is the pain?"
                  className="h-36 text-lg p-4 focus-visible:ring-primary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button className="w-full h-16 text-xl font-bold shadow-xl bg-primary hover:bg-primary/90" onClick={handleAnalysis}>
                Run Analysis & Listen <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Results */}
        {step === 3 && (
          <div className="space-y-6 animate-in zoom-in-95">
            {isAnalyzing ? (
              <Card className="p-24 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
                <p className="text-lg font-medium text-slate-600">Evaluating clinical urgency...</p>
              </Card>
            ) : result && (
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex gap-2">
                    {isSpeaking ? (
                        <Button size="icon" variant="destructive" className="rounded-full h-10 w-10 shadow-lg" onClick={stopAudio}><VolumeX /></Button>
                    ) : (
                        <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 shadow-lg bg-white/10 hover:bg-white/20" onClick={() => speakResults(result.possibilities)}><Volume2 /></Button>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-400 font-bold"><Info className="h-5 w-5" /> AI Medical Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 p-8 pt-4">
                    <p className="text-2xl font-light italic leading-relaxed text-blue-50">
                        "{result.possibilities}"
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Badge className={`${result.severity === 'High' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'} px-6 py-1.5 text-sm`}>
                        Urgency: {result.severity}
                      </Badge>
                      <div className="flex items-center gap-2 bg-white/10 px-5 py-1.5 rounded-full text-sm font-medium border border-white/10">
                        <Stethoscope className="h-4 w-4 text-blue-400" /> Consult: {result.specialist}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="bg-green-50 border-green-100 shadow-sm">
                      <CardHeader className="py-3 px-4"><CardTitle className="text-green-800 text-sm flex items-center gap-2"><Apple className="h-4 w-4" /> Diet Recommendations</CardTitle></CardHeader>
                      <CardContent className="px-4 pb-4"><ul className="list-disc pl-5 text-xs space-y-2 text-green-900">{result.diet.map((d: any) => <li key={d} className="font-medium">{d}</li>)}</ul></CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-100 shadow-sm">
                      <CardHeader className="py-3 px-4"><CardTitle className="text-orange-800 text-sm flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Activity Advice</CardTitle></CardHeader>
                      <CardContent className="px-4 pb-4"><ul className="list-disc pl-5 text-xs space-y-2 text-orange-900">{result.exercise.map((e: any) => <li key={e} className="font-medium">{e}</li>)}</ul></CardContent>
                    </Card>

                    <Button className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90" onClick={() => navigate("/patient/book-appointment", { state: { specialty: result.specialist } })}>
                      Book Specialist Appointment <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowLeft(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
}