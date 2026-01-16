import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Video } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_type: "patient" | "doctor";
  read_at: string | null;
}

interface Patient {
  user_id: string;
  full_name: string;
}

const DoctorMessages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [doctorUserId, setDoctorUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeMessaging();
  }, []);

  useEffect(() => {
    if (selectedPatient && doctorUserId) {
      fetchMessages();
      markMessagesAsRead();
      setupRealtimeSubscription();
    }
  }, [selectedPatient, doctorUserId]);

  const initializeMessaging = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/doctor/auth");
      return;
    }

    setDoctorUserId(session.user.id);

    // Fetch patients who have messaged the doctor
    const { data: messagesData } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .or(`receiver_id.eq.${session.user.id},sender_id.eq.${session.user.id}`);

    if (messagesData) {
      const uniquePatientIds = Array.from(
        new Set(
          messagesData.map((msg) =>
            msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id
          )
        )
      );

      // Fetch patient profiles
      const { data: patientsData } = await supabase
        .from("patient_profiles")
        .select("user_id, full_name")
        .in("user_id", uniquePatientIds);

      setPatients((patientsData as Patient[]) || []);
    }
  };

  const fetchMessages = async () => {
    if (!doctorUserId || !selectedPatient) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${doctorUserId},receiver_id.eq.${selectedPatient.user_id}),and(sender_id.eq.${selectedPatient.user_id},receiver_id.eq.${doctorUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages((data as Message[]) || []);
    }
  };

  const markMessagesAsRead = async () => {
    if (!doctorUserId || !selectedPatient) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", doctorUserId)
      .eq("sender_id", selectedPatient.user_id)
      .is("read_at", null);
  };

  const setupRealtimeSubscription = () => {
    if (!doctorUserId) return;

    const channel = supabase
      .channel('doctor_messages')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${doctorUserId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          if (selectedPatient && newMsg.sender_id === selectedPatient.user_id) {
            setMessages(prev => [...prev, newMsg]);
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient || !doctorUserId) return;

    setLoading(true);
    const { error } = await supabase.from("messages").insert([{
      sender_id: doctorUserId,
      receiver_id: selectedPatient.user_id,
      message: newMessage,
      sender_type: "doctor" as const,
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

  const startVideoCall = async () => {
  if (!selectedPatient || !doctorUserId) return;

  // 1️⃣ Send call notification message
  await supabase.from("messages").insert({
    sender_id: doctorUserId,
    receiver_id: selectedPatient.user_id,
    message: "__VIDEO_CALL_STARTED__",
    sender_type: "doctor",
  });

  // 2️⃣ Navigate doctor to video call
  navigate(`/doctor/video-call/${selectedPatient.user_id}`);
};


  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/doctor/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patients</CardTitle>
              <CardDescription>Select a patient to chat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patients.map((patient) => (
                  <div
                    key={patient.user_id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPatient?.user_id === patient.user_id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <p className="font-semibold">{patient.full_name}</p>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedPatient ? selectedPatient.full_name : "Select a patient"}
                  </CardTitle>
                </div>
                {selectedPatient && (
                  <Button onClick={startVideoCall} size="sm">
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <>
                  <ScrollArea className="h-96 pr-4 mb-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_id === doctorUserId ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs p-3 rounded-lg ${
                              msg.sender_id === doctorUserId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
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
                  Select a patient to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorMessages;