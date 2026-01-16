import React, { useState } from "react";
import { UserCircle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ================= HELPERS ================= */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const Welcome = () => {
  const navigate = useNavigate();
  const [openFeature, setOpenFeature] = useState(null);

  const features = [
    {
      title: "AI-Powered Analysis",
      desc: "Analyzes patient symptoms using AI to provide preliminary health insights and decision support.",
    },
    {
      title: "Blockchain-like Security",
      desc: "Medical data is secured using hash-based integrity checks and secure database storage to detect tampering.",
    },
    {
      title: "Digital Consultations",
      desc: "Enables seamless doctor–patient interaction with digital prescriptions and medical records.",
    },
  ];

  const developers = ["Jyothika", "Nikitha", "Harish", "Geetha"];
  const [shuffledDevs] = useState(() => shuffleArray(developers));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16">

        {/* ================= HEADER ================= */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            HealthCare AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
            An AI-assisted healthcare platform that helps patients and doctors
            manage consultations, medical records, and health insights securely.
          </p>
        </motion.div>

        {/* ================= ROLE CARDS ================= */}
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">

          <motion.div
            whileHover={{ scale: 1.05 }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card className="p-10 border-2 border-blue-200 rounded-2xl shadow-md">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserCircle className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-3xl font-semibold text-blue-700">I'm a Patient</h2>
                <p className="text-gray-600 mt-3 mb-6">
                  Get AI-based health insights, book appointments, and access medical records securely.
                </p>
                <Button
                  onClick={() => navigate("/patient/auth")}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                >
                  Get Started
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <Card className="p-10 border-2 border-cyan-200 rounded-2xl shadow-md">
              <div className="text-center">
                <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Stethoscope className="w-12 h-12 text-cyan-600" />
                </div>
                <h2 className="text-3xl font-semibold text-cyan-700">I'm a Doctor</h2>
                <p className="text-gray-600 mt-3 mb-6">
                  View patient details, provide prescriptions, and manage consultations digitally.
                </p>
                <Button
                  onClick={() => navigate("/doctor/auth")}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white"
                >
                  Connect
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ================= FEATURES ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-24 grid md:grid-cols-3 gap-10 max-w-5xl mx-auto"
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} whileHover={{ y: -8 }}>
              <Card
                onClick={() => setOpenFeature(openFeature === idx ? null : idx)}
                className="p-6 cursor-pointer rounded-xl border bg-white/70 hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-center text-xl text-blue-700">
                  {feature.title}
                </h3>
                {openFeature === idx && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-600 text-sm mt-4 text-center"
                  >
                    {feature.desc}
                  </motion.p>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ================= ABOUT ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-28 text-center"
        >
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-6">
            About Our Project
          </h2>
          <p className="max-w-4xl mx-auto text-gray-600 text-lg">
            This project focuses on building an AI-assisted healthcare system that supports
            digital consultations, symptom analysis, and secure medical record management.
            The system acts as a decision-support platform to improve accessibility and efficiency.
          </p>
        </motion.div>

        {/* ================= HOW IT WORKS ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-24 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition">
              <h3 className="font-semibold text-blue-700">1. Registration</h3>
              <p className="text-sm text-gray-600 mt-2">
                Patients and doctors securely register and log in using authentication.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition">
              <h3 className="font-semibold text-cyan-700">2. Symptom Analysis</h3>
              <p className="text-sm text-gray-600 mt-2">
                Patients enter symptoms and receive AI-based preliminary health insights.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition">
              <h3 className="font-semibold text-purple-700">3. Consultation</h3>
              <p className="text-sm text-gray-600 mt-2">
                Doctors review patient details and provide digital consultations and prescriptions.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition">
              <h3 className="font-semibold text-green-700">4. Secure Storage</h3>
              <p className="text-sm text-gray-600 mt-2">
                Medical data is stored securely with integrity checks to detect tampering.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* ================= APPLICATION FEATURES ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-28 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-12">
            Application Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Secure Patient & Doctor Authentication",
              "Patient Profile & Medical History Management",
              "Doctor Profile & Consultation Access",
              "AI-Based Symptom Analysis (Preliminary Insights)",
              "Appointment & Consultation System",
              "Digital Prescription Generation",
              "Medical Records Management",
              "Secure Data Storage with Integrity Checks",
              "Responsive & User-Friendly Interface",
            ].map((item, index) => (
              <Card key={index} className="p-5 text-center bg-white/70 hover:shadow-md transition">
                <p className="text-gray-700 font-medium">{item}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ================= DEVELOPED BY ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-24 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-700 mb-3">
            Developed By
          </h3>
          <p className="text-lg">
            {shuffledDevs.map((name, index) => (
              <span
                key={name}
                className={`font-semibold ${
                  index % 4 === 0
                    ? "text-blue-700"
                    : index % 4 === 1
                    ? "text-cyan-700"
                    : index % 4 === 2
                    ? "text-purple-700"
                    : "text-green-700"
                }`}
              >
                {name}
                {index !== shuffledDevs.length - 1 && " • "}
              </span>
            ))}
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default Welcome;
