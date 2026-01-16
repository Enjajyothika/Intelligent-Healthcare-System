import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Chatbot from "./components/Chatbot";
import PatientAuth from "./pages/patient/PatientAuth";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientHealthMetrics from "./pages/patient/PatientHealthMetrics";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientProfile from "./pages/patient/PatientProfile";
import SymptomsAnalyzer from "./pages/patient/SymptomsAnalyzer";
import PatientMessaging from "./pages/patient/PatientMessaging";
import VideoCall from "./pages/patient/VideoCall";
import DoctorAuth from "./pages/doctor/DoctorAuth";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorProfileSetup from "./pages/doctor/DoctorProfileSetup";
import DoctorAvailability from "./pages/doctor/DoctorAvailability";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorMessages from "./pages/doctor/DoctorMessages";
import DoctorPatientRecords from "./pages/doctor/DoctorPatientRecords";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import DoctorMedicalReports from "./pages/doctor/DoctorMedicalReports";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientMedicalReports from "./pages/patient/PatientMedicalReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/patient/auth" element={<PatientAuth />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/health-metrics" element={<PatientHealthMetrics />} />
          <Route path="/patient/book-appointment" element={<BookAppointment />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/symptoms-analyzer" element={<SymptomsAnalyzer />} />
          <Route path="/patient/messaging" element={<PatientMessaging />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/patient/medical-reports" element={<PatientMedicalReports />} />
          <Route path="/patient/video-call/:doctorId" element={<VideoCall />} />
          <Route path="/doctor/auth" element={<DoctorAuth />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/profile-setup" element={<DoctorProfileSetup />} />
          <Route path="/doctor/availability" element={<DoctorAvailability />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/messages" element={<DoctorMessages />} />
          <Route path="/doctor/patients" element={<DoctorPatientRecords />} />
          <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
          <Route path="/doctor/medical-reports" element={<DoctorMedicalReports />} />
          <Route path="/doctor/video-call/:patientId" element={<VideoCall />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
