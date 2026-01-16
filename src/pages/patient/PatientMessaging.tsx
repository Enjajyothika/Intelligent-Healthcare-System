import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Video, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_type: "patient" | "doctor";
  read_at?: string;
}

interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
}

const PatientMessaging = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeMessaging();
  }, []);

  useEffect(() => {
    if (selectedDoctor && patientId) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [selectedDoctor, patientId]);

  const initializeMessaging = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/patient/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("patient_profiles")
      .select("id, user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile) {
      setPatientId(profile.user_id);
      fetchDoctors();
    }
  };

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, full_name, specialization")
      .eq("is_available", true);

    setDoctors(data || []);
  };

  const fetchMessages = async () => {
    if (!patientId || !selectedDoctor) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${patientId},receiver_id.eq.${selectedDoctor.user_id}),and(sender_id.eq.${selectedDoctor.user_id},receiver_id.eq.${patientId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages((data as Message[]) || []);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!patientId || !selectedDoctor) return;

    const channel = supabase
      .channel('patient_messages')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${patientId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDoctor || !patientId) return;

    setLoading(true);
    const { error } = await supabase.from("messages").insert([{
      sender_id: patientId,
      receiver_id: selectedDoctor.user_id,
      message: newMessage,
      sender_type: "patient" as const,
    }] as any);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      fetchMessages();
    }
    setLoading(false);
  };

  const startVideoCall = () => {
    if (selectedDoctor) {
      navigate(`/patient/video-call/${selectedDoctor.user_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/patient/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctors</CardTitle>
              <CardDescription>Select a doctor to chat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDoctor?.id === doctor.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <p className="font-semibold">{doctor.full_name}</p>
                    <p className="text-sm opacity-80">{doctor.specialization}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedDoctor ? selectedDoctor.full_name : "Select a doctor"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDoctor?.specialization}
                  </CardDescription>
                </div>
                {selectedDoctor && (
                  <div className="flex gap-2">
                    <Button onClick={startVideoCall} size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Video Call
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDoctor ? (
                <>
                  <ScrollArea className="h-96 pr-4 mb-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_id === patientId ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs p-3 rounded-lg ${
                              msg.sender_id === patientId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.message === "__VIDEO_CALL_STARTED__" ? (
  <div className="bg-muted p-3 rounded-lg">
    <p className="text-sm mb-2 font-medium">
      Doctor is calling…
    </p>
    <Button
      size="sm"
      onClick={() => navigate(`/patient/video-call/${msg.sender_id}`)}
    >
      Join Video Call
    </Button>
  </div>
) : (
  <p className="text-sm">{msg.message}</p>
)}

                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={loading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Select a doctor to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientMessaging;