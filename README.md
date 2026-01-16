# Intelligent Healthcare System 🏥

## 📌 Project Overview

The **Intelligent Healthcare System** is an AI-assisted, web-based healthcare platform designed to improve patient–doctor interaction and provide preliminary health insights using modern web technologies and generative AI.

The system enables patients to analyze symptoms, book appointments, and consult doctors remotely, while ensuring secure data handling through role-based access control and authentication.

This project is built with a **TypeScript-first, industry-oriented stack** and focuses on real-world usability rather than training custom machine learning models.

---

## 🚀 Features

* **AI-Based Symptom Analysis**
  Uses generative AI to analyze patient-entered symptoms and provide possible conditions, severity level, and recommended specialist.

* **Health Metrics Tracking**
  Allows users to track and monitor key health metrics over time, supporting better health awareness and follow-up analysis.

* **Secure Medical Document Upload with Hash Verification**
  Patients can upload medical documents, which are protected using cryptographic hash verification to ensure data integrity and prevent tampering.

* **Role-Based Access Control (RBAC)**
  Secure access separation for Patients, Doctors, and Admins.

* **Appointment Booking & Management**
  Patients can book appointments; doctors can manage schedules efficiently.

* **Remote Consultation Support**
  Enables online consultations, reducing the need for physical hospital visits.

* **Video Consultation Service**
  Supports real-time video consultations between patients and doctors for face-to-face remote healthcare.

* **Real-Time Communication**
  Supports real-time updates and interactions using WebSockets.

* **Secure Authentication & Data Handling**
  Protects sensitive healthcare data using authenticated APIs and environment-based configuration.

---

## 🛠️ Tech Stack

### Frontend

* **TypeScript**
* **React 18** (Vite-powered)
* **Vite**
* **Tailwind CSS**
* **shadcn/ui** & **Radix UI**
* **React Router DOM**
* **React Hook Form + Zod**
* **Framer Motion**
* **Recharts**

### Backend & Real-Time

* **Node.js**
* **Express.js**
* **Socket.IO**

### Database & Authentication

* **Supabase** (Auth, Database, Storage)

### AI Integration

* **Google Gemini API** (Generative AI for symptom analysis)

### State & Tooling

* **TanStack React Query**
* **ESLint**
* **PostCSS & Autoprefixer**

---

## ⚙️ How to Run the Project

### Prerequisites

* Node.js (v16+)
* npm or yarn
* Supabase account
* Google Gemini API key

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Enjajyothika/Intelligent-Healthcare-System.git
   cd Intelligent-Healthcare-System
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root

   ```env
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_URL=https://your-project-id.supabase.co

   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. Open your browser and visit:

   ```
   http://localhost:5173
   ```

---

## 🎯 Use Cases

* Preliminary health assessment and guidance
* Continuous health metric monitoring
* Secure storage and verification of medical records
* Remote healthcare access through chat and **video consultations**
* Digital appointment scheduling
