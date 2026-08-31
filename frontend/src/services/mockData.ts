import { HospitalInfo, Department, Doctor, ServiceItem, FacilityItem, Appointment, DoctorApplication, AuditLog, DoctorAvailability } from '../types';

export const fallbackHospitalInfo: HospitalInfo = {
  name: "City Care Super Specialty Hospital",
  tagline: "Advanced Healthcare with Compassion & Excellence",
  address: "123 Healthcare Boulevard, Medical District, Bengaluru, Karnataka - 560001",
  phone: "+91 80 2345 6789",
  emergencyPhone: "+91 80 2345 9999",
  email: "care@citycarehospital.example.com",
  operatingHours: "24/7 Emergency & OPD (Mon-Sat 8:00 AM - 8:00 PM)",
  mapEmbedUrl: "https://maps.google.com/maps?q=Bengaluru&t=&z=13&ie=UTF8&iwloc=&output=embed",
  whatsAppNumber: "+919876543210",
  certifications: ["NABH Accredited", "ISO 9001:2015 Certified", "NABL Laboratory"],
  statistics: [
    { label: "Specialty Departments", value: "15+" },
    { label: "Expert Doctors", value: "45+" },
    { label: "Bed Capacity", value: "200+" },
    { label: "Satisfied Patients", value: "50,000+" }
  ],
  socials: {
    facebook: "https://facebook.com/example",
    twitter: "https://twitter.com/example",
    instagram: "https://instagram.com/example",
    linkedin: "https://linkedin.com/example"
  }
};

export const fallbackDepartments: Department[] = [
  {
    id: "dept-1",
    name: "Cardiology",
    code: "CARD",
    description: "Comprehensive cardiovascular diagnosis, angioplasty, cardiac rehabilitation, and heart care.",
    iconName: "HeartPulse",
    active: true
  },
  {
    id: "dept-2",
    name: "Neurology & Neurosurgery",
    code: "NEUR",
    description: "Advanced brain and nerve care, stroke management, spine surgery, and neurological rehabilitation.",
    iconName: "Brain",
    active: true
  },
  {
    id: "dept-3",
    name: "Orthopedics & Joint Replacement",
    code: "ORTH",
    description: "Joint replacement, fracture care, sports injury management, and arthroscopic surgery.",
    iconName: "Bone",
    active: true
  },
  {
    id: "dept-4",
    name: "Pediatrics & Neonatal Care",
    code: "PEDI",
    description: "Holistic child healthcare, vaccinations, pediatric intensive care, and developmental wellness.",
    iconName: "Baby",
    active: true
  },
  {
    id: "dept-5",
    name: "General & Internal Medicine",
    code: "GMED",
    description: "Primary care, chronic disease management, diabetes, hypertension, and preventive health checks.",
    iconName: "Stethoscope",
    active: true
  },
  {
    id: "dept-6",
    name: "Dermatology & Cosmetology",
    code: "DERM",
    description: "Clinical skin disorders, laser therapies, pediatric dermatology, and cosmetic procedures.",
    iconName: "Sparkles",
    active: true
  }
];

export const fallbackDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Rajesh Kumar",
    qualification: "MBBS, MD (General Medicine), DM (Cardiology)",
    designation: "Chief Interventional Cardiologist & HOD",
    departmentId: "dept-1",
    departmentName: "Cardiology",
    specialization: "Interventional Cardiology",
    experienceYears: 18,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 700,
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    bio: "Pioneer in complex radial angioplasty and structural heart interventions with over 15,000 successful procedures.",
    active: true
  },
  {
    id: "doc-2",
    name: "Dr. Ananya Sharma",
    qualification: "MBBS, MS (General Surgery), MCh (Neurosurgery)",
    designation: "Senior Consultant Neurosurgeon",
    departmentId: "dept-2",
    departmentName: "Neurology & Neurosurgery",
    specialization: "Neurosurgery",
    experienceYears: 14,
    languages: ["Kannada", "English"],
    consultationFee: 800,
    photoUrl: "https://images.unsplash.com/photo-1594824813633-890438b37e65?auto=format&fit=crop&q=80&w=400",
    bio: "Specialist in minimally invasive brain tumor resections, complex spinal stabilization, and stroke intervention.",
    active: true
  },
  {
    id: "doc-3",
    name: "Dr. Vikram Gowda",
    qualification: "MBBS, MS (Ortho), Fellowship in Joint Replacement",
    designation: "Head of Orthopedics & Joint Reconstruction",
    departmentId: "dept-3",
    departmentName: "Orthopedics & Joint Replacement",
    specialization: "Orthopedics",
    experienceYears: 16,
    languages: ["Kannada", "English", "Telugu"],
    consultationFee: 650,
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    bio: "Performed over 4,000 robotic knee and hip replacements with excellent patient recovery outcomes.",
    active: true
  },
  {
    id: "doc-4",
    name: "Dr. Meenakshi Sundaram",
    qualification: "MBBS, MD (Pediatrics), Fellowship in Neonatology",
    designation: "Senior Consultant Pediatrician",
    departmentId: "dept-4",
    departmentName: "Pediatrics & Neonatal Care",
    specialization: "Pediatrics",
    experienceYears: 12,
    languages: ["Kannada", "English", "Tamil"],
    consultationFee: 500,
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    bio: "Compassionate pediatric care specialist focusing on neonatal ICU management and childhood developmental milestones.",
    active: true
  },
  {
    id: "doc-5",
    name: "Dr. Suresh Patil",
    qualification: "MBBS, MD (Internal Medicine)",
    designation: "Consultant Physician & Diabetologist",
    departmentId: "dept-5",
    departmentName: "General & Internal Medicine",
    specialization: "General Medicine",
    experienceYears: 15,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 500,
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    bio: "Expert in complex diabetic management, lifestyle disorders, hypertension, and adult preventative wellness.",
    active: true
  },
  {
    id: "doc-6",
    name: "Dr. Deepa Kulkarni",
    qualification: "MBBS, MD (DVL - Dermatology & Venereology)",
    designation: "Consultant Dermatologist & Cosmetologist",
    departmentId: "dept-6",
    departmentName: "Dermatology & Cosmetology",
    specialization: "Dermatology",
    experienceYears: 9,
    languages: ["Kannada", "English", "Marathi"],
    consultationFee: 600,
    photoUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400",
    bio: "Specializing in advanced laser therapy, clinical dermatology, hair restoration, and allergy management.",
    active: true
  }
];

export const fallbackDoctorAvailability: DoctorAvailability = {
  id: "avail-1",
  doctorId: "doc-1",
  weeklySchedule: [
    { dayOfWeek: "Monday", slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "04:00 PM", endTime: "07:00 PM" }] },
    { dayOfWeek: "Tuesday", slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "04:00 PM", endTime: "07:00 PM" }] },
    { dayOfWeek: "Wednesday", slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "04:00 PM", endTime: "07:00 PM" }] },
    { dayOfWeek: "Thursday", slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "04:00 PM", endTime: "07:00 PM" }] },
    { dayOfWeek: "Friday", slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "04:00 PM", endTime: "07:00 PM" }] },
    { dayOfWeek: "Saturday", slots: [{ startTime: "09:00 AM", endTime: "02:00 PM" }] }
  ],
  unavailabilities: []
};

export const fallbackServices: ServiceItem[] = [
  {
    id: "srv-1",
    name: "Emergency & Trauma Care",
    shortDescription: "24/7 rapid response trauma center with dedicated resuscitation bays.",
    fullDescription: "Fully equipped with advanced life support ambulances, triaging protocols, and board-certified trauma surgeons.",
    iconName: "Siren",
    displayOrder: 1,
    active: true
  },
  {
    id: "srv-2",
    name: "Advanced Diagnostic Radiology",
    shortDescription: "3T MRI, 128-Slice CT, Digital X-Ray, and 4D Ultrasound.",
    fullDescription: "Round-the-clock radiology reporting with zero-delay picture archiving systems (PACS).",
    iconName: "Scan",
    displayOrder: 2,
    active: true
  },
  {
    id: "srv-3",
    name: "Modular Operation Theatres",
    shortDescription: "Laminar airflow surgical suites with HEPA filtration.",
    fullDescription: "Designed to minimize surgical site infections with cutting-edge laparoscopic and robotic surgical towers.",
    iconName: "Activity",
    displayOrder: 3,
    active: true
  }
];

export const fallbackFacilities: FacilityItem[] = [
  {
    id: "fac-1",
    name: "24/7 In-House Pharmacy",
    description: "Complete stock of life-saving critical care medications, injectables, and surgical consumables.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600",
    displayOrder: 1,
    active: true
  },
  {
    id: "fac-2",
    name: "ICU, CCU & NICU Units",
    description: "Multidisciplinary intensive care units monitored 1:1 by critical care intensivists.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
    displayOrder: 2,
    active: true
  },
  {
    id: "fac-3",
    name: "24/7 Cardiac Catheterization Lab",
    description: "Ultra-modern flat-panel cath lab for emergent primary PCI and stroke thrombectomy.",
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
    displayOrder: 3,
    active: true
  }
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const fallbackAppointments: Appointment[] = [
  {
    id: "APT-2026-101",
    tokenNumber: "T-01",
    patientName: "Sohan Kumar",
    patientPhone: "+91 9876543210",
    patientEmail: "sohan.k@example.com",
    departmentId: "dept-1",
    departmentName: "Cardiology",
    doctorId: "doc-1",
    doctorName: "Dr. Rajesh Kumar",
    preferredDate: today,
    preferredTime: "10:30 AM",
    reason: "Routine Cardiac Followup & ECG",
    status: "CONFIRMED",
    source: "VOICE_AI",
    createdAt: new Date().toISOString()
  },
  {
    id: "APT-2026-102",
    tokenNumber: "T-02",
    patientName: "Ramesh Sharma",
    patientPhone: "+91 9845123456",
    patientEmail: "ramesh.sharma@example.com",
    departmentId: "dept-3",
    departmentName: "Orthopedics & Joint Replacement",
    doctorId: "doc-3",
    doctorName: "Dr. Vikram Gowda",
    preferredDate: today,
    preferredTime: "11:15 AM",
    reason: "Knee Joint Pain & X-Ray Review",
    status: "CONFIRMED",
    source: "VOICE_AI",
    createdAt: new Date().toISOString()
  },
  {
    id: "APT-2026-103",
    tokenNumber: "T-03",
    patientName: "Pooja Hegde",
    patientPhone: "+91 9741234567",
    patientEmail: "pooja.h@example.com",
    departmentId: "dept-2",
    departmentName: "Neurology & Neurosurgery",
    doctorId: "doc-2",
    doctorName: "Dr. Ananya Sharma",
    preferredDate: today,
    preferredTime: "02:30 PM",
    reason: "Migraine & Neurological Consultation",
    status: "NEW",
    source: "WEB",
    createdAt: new Date().toISOString()
  },
  {
    id: "APT-2026-104",
    tokenNumber: "T-04",
    patientName: "Kavitha Reddy",
    patientPhone: "+91 9900112233",
    patientEmail: "kavitha.r@example.com",
    departmentId: "dept-4",
    departmentName: "Pediatrics & Neonatal Care",
    doctorId: "doc-4",
    doctorName: "Dr. Meenakshi Sundaram",
    preferredDate: tomorrow,
    preferredTime: "10:00 AM",
    reason: "Child Immunization & Growth Check",
    status: "CONFIRMED",
    source: "VOICE_AI",
    createdAt: new Date().toISOString()
  },
  {
    id: "APT-2026-105",
    tokenNumber: "T-05",
    patientName: "Manjunath Rao",
    patientPhone: "+91 9886554433",
    patientEmail: "manjunath.rao@example.com",
    departmentId: "dept-5",
    departmentName: "General & Internal Medicine",
    doctorId: "doc-5",
    doctorName: "Dr. Suresh Patil",
    preferredDate: tomorrow,
    preferredTime: "11:45 AM",
    reason: "Diabetes HbA1c Monitoring",
    status: "CONFIRMED",
    source: "WEB",
    createdAt: new Date().toISOString()
  },
  {
    id: "APT-2026-106",
    tokenNumber: "T-06",
    patientName: "Deepak Nayak",
    patientPhone: "+91 9731009988",
    patientEmail: "deepak.n@example.com",
    departmentId: "dept-6",
    departmentName: "Dermatology & Cosmetology",
    doctorId: "doc-6",
    doctorName: "Dr. Deepa Kulkarni",
    preferredDate: tomorrow,
    preferredTime: "04:00 PM",
    reason: "Skin Allergy & Eczema Consultation",
    status: "COMPLETED",
    source: "VOICE_AI",
    createdAt: new Date().toISOString()
  }
];

export const fallbackDoctorApplications: DoctorApplication[] = [
  {
    id: "app-doc-1",
    name: "Dr. Neha Rao",
    email: "neha.rao@example.com",
    phone: "+91 9845012345",
    qualification: "MBBS, MD (Pulmonology), Fellowship in Sleep Medicine",
    specialization: "Pulmonology & Respiratory Care",
    designation: "Consultant Pulmonologist",
    departmentId: "dept-5",
    departmentName: "General & Internal Medicine",
    experienceYears: 8,
    registrationNumber: "KMC-89241",
    languages: ["Kannada", "English", "Hindi"],
    bio: "Expert in asthma management, bronchoscopy, pulmonary fibrosis, and post-COVID lung rehabilitation.",
    status: "PENDING_VERIFICATION",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "app-doc-2",
    name: "Dr. Anand Kulkarni",
    email: "anand.kulkarni@example.com",
    phone: "+91 9741098765",
    qualification: "MBBS, MS (ENT), DNB",
    specialization: "Otorhinolaryngology (ENT)",
    designation: "Senior ENT & Head Neck Surgeon",
    departmentId: "dept-5",
    departmentName: "General & Internal Medicine",
    experienceYears: 11,
    registrationNumber: "KMC-77120",
    languages: ["Kannada", "English", "Marathi"],
    bio: "Specializing in endoscopic sinus surgery, micro-ear surgery, and cochlear implant evaluations.",
    status: "PENDING_VERIFICATION",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "app-doc-3",
    name: "Dr. Sneha Patil",
    email: "sneha.patil@example.com",
    phone: "+91 9900223344",
    qualification: "MBBS, MD (Obstetrics & Gynecology)",
    specialization: "High-Risk Obstetrics & Laparoscopic Gynecology",
    designation: "Consultant Gynecologist",
    departmentId: "dept-4",
    departmentName: "Pediatrics & Neonatal Care",
    experienceYears: 10,
    registrationNumber: "KMC-94301",
    languages: ["Kannada", "English"],
    bio: "Painless normal deliveries, laparoscopic fibroid resections, and comprehensive adolescent wellness.",
    status: "PENDING_VERIFICATION",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export const fallbackAuditLogs: AuditLog[] = [
  {
    id: "log-101",
    userId: "ai-agent-v1",
    actor: { id: "ai-agent-v1", name: "Bilingual AI Voice Agent", role: "VOICE_AI" },
    action: "VOICE_APPOINTMENT_CONFIRMED",
    entity: "APPOINTMENT",
    entityId: "APT-2026-101",
    details: "Bilingual AI Voice Agent successfully booked appointment for patient Sohan Kumar with Dr. Rajesh Kumar (Cardiology).",
    ipAddress: "127.0.0.1 (Web Telephony)",
    createdAt: new Date().toISOString()
  },
  {
    id: "log-102",
    userId: "admin-2",
    actor: { id: "admin-2", name: "Priya Sharma", role: "HOSPITAL_ADMIN" },
    action: "DOCTOR_SLOT_UPDATE",
    entity: "AVAILABILITY",
    entityId: "doc-1",
    details: "Hospital Admin updated OPD slot capacity for Dr. Rajesh Kumar to 30 tokens.",
    ipAddress: "192.168.1.104",
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "log-103",
    userId: "ai-agent-v1",
    actor: { id: "ai-agent-v1", name: "Bilingual AI Voice Agent", role: "VOICE_AI" },
    action: "VOICE_APPOINTMENT_CONFIRMED",
    entity: "APPOINTMENT",
    entityId: "APT-2026-102",
    details: "Voice Agent verified Kannada input and confirmed Orthopedics slot for Ramesh Sharma.",
    ipAddress: "127.0.0.1 (Web Telephony)",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "log-104",
    userId: "admin-1",
    actor: { id: "admin-1", name: "Dr. Ramesh Rao", role: "SUPER_ADMIN" },
    action: "EMERGENCY_SYSTEM_TEST",
    entity: "TELEPHONY",
    entityId: "108-GUARDRAIL",
    details: "Super Admin verified 108 Ambulance safety triage guardrail protocol in Kannada and English.",
    ipAddress: "10.0.0.15",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "log-105",
    userId: "superadmin-1",
    actor: { id: "superadmin-1", name: "Super Admin", role: "SUPER_ADMIN" },
    action: "DOCTOR_APPLICATION_SUBMITTED",
    entity: "DOCTOR_APPLICATION",
    entityId: "app-doc-1",
    details: "New Doctor Application submitted by Dr. Neha Rao (Pulmonology). Status: PENDING review.",
    ipAddress: "49.37.12.8",
    createdAt: new Date(Date.now() - 14400000).toISOString()
  }
];

export const fallbackManagementStats = {
  totalAppointments: 148,
  todayAppointments: 26,
  activeDoctors: 18,
  pendingDoctorApplications: 3,
  totalPatients: 1420,
  opdOccupancy: "88%",
  voiceCallsHandled: 364,
  voiceSatisfactionRate: "98.2%",
  activeDepartments: 15,
  telephonyStats: {
    totalMinutes: "1,420 mins",
    avgDuration: "1m 48s",
    resolvedByAI: "94.6%",
    bilingualRatio: "62% Kannada / 38% English"
  }
};
