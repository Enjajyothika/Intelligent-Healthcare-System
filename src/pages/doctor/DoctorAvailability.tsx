import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DoctorAvailability = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      navigate("/doctor/auth");
      return;
    }

    fetchProfile(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileData) {
      toast({
        title: "Profile not found",
        description: "Please complete your profile setup first.",
        variant: "destructive",
      });
      navigate("/doctor/profile-setup");
      return;
    }

    setDoctorId(profileData.id);
    fetchTimeSlots(profileData.id);
  };

  const fetchTimeSlots = async (doctorId: string) => {
    const { data, error } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch availability.",
        variant: "destructive",
      });
    } else {
      setTimeSlots(data || []);
    }
    setLoading(false);
  };

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      {
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        is_available: true,
      },
    ]);
  };

  const removeTimeSlot = async (index: number) => {
    const slot = timeSlots[index];
    if (slot.id) {
      const { error } = await supabase
        .from("doctor_availability")
        .delete()
        .eq("id", slot.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete time slot.",
          variant: "destructive",
        });
        return;
      }
    }
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
    toast({
      title: "Success",
      description: "Time slot removed.",
    });
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const saveAvailability = async () => {
    if (!doctorId) return;

    setLoading(true);
    for (const slot of timeSlots) {
      if (slot.id) {
        const { error } = await supabase
          .from("doctor_availability")
          .update({
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
          })
          .eq("id", slot.id);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to update availability.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from("doctor_availability")
          .insert({
            doctor_id: doctorId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
          });

        if (error) {
          toast({
            title: "Error",
            description: "Failed to save availability.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
    }

    toast({
      title: "Success",
      description: "Availability schedule saved successfully.",
    });
    fetchTimeSlots(doctorId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  const groupedSlots = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/doctor/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Availability Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Manage your weekly availability and working hours
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Select a date to view</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>Your availability overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {daysOfWeek.map((day, index) => {
                    const daySlots = groupedSlots[index] || [];
                    return (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="font-medium text-sm">{day}</span>
                        <span className="text-xs text-muted-foreground">
                          {daySlots.length > 0 ? `${daySlots.length} slot${daySlots.length > 1 ? 's' : ''}` : 'Not set'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Time Slots</CardTitle>
                    <CardDescription>Configure your working hours for each day</CardDescription>
                  </div>
                  <Button onClick={addTimeSlot} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {timeSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No availability slots configured yet</p>
                    <Button onClick={addTimeSlot} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeSlots.map((slot, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={slot.day_of_week.toString()}
                                onValueChange={(value) =>
                                  updateTimeSlot(index, "day_of_week", parseInt(value))
                                }
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {daysOfWeek.map((day, dayIndex) => (
                                    <SelectItem key={dayIndex} value={dayIndex.toString()}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) =>
                                  updateTimeSlot(index, "start_time", e.target.value)
                                }
                                className="w-[120px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) =>
                                  updateTimeSlot(index, "end_time", e.target.value)
                                }
                                className="w-[120px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={slot.is_available.toString()}
                                onValueChange={(value) =>
                                  updateTimeSlot(index, "is_available", value === "true")
                                }
                              >
                                <SelectTrigger className="w-[110px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Available</SelectItem>
                                  <SelectItem value="false">Unavailable</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeSlot(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {timeSlots.length > 0 && (
                  <div className="flex justify-end mt-6">
                    <Button onClick={saveAvailability} disabled={loading}>
                      Save Availability
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
