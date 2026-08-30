import { HospitalInfo, Department, Doctor, DoctorAvailability, ServiceItem, FacilityItem, AdminUser, Appointment } from '../models/types';
import bcrypt from 'bcryptjs';

export const defaultHospitalInfo: HospitalInfo = {
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

export const defaultDepartments: Department[] = [
  {
    id: "dept-cardio",
    name: "Cardiology",
    code: "CARD",
    description: "Comprehensive cardiovascular diagnosis, angioplasty, cardiac rehabilitation, and heart care.",
    iconName: "HeartPulse",
    active: true
  },
  {
    id: "dept-neuro",
    name: "Neurology & Neurosurgery",
    code: "NEUR",
    description: "Advanced brain and nerve care, stroke management, spine surgery, and neurological rehabilitation.",
    iconName: "Brain",
    active: true
  },
  {
    id: "dept-ortho",
    name: "Orthopedics & Joint Replacement",
    code: "ORTH",
    description: "Joint replacement, fracture care, sports injury management, and arthroscopic surgery.",
    iconName: "Bone",
    active: true
  },
  {
    id: "dept-pedia",
    name: "Pediatrics & Neonatology",
    code: "PEDI",
    description: "Specialized pediatric care, NICU facilities, childhood vaccination, and growth monitoring.",
    iconName: "Baby",
    active: true
  },
  {
    id: "dept-gynaec",
    name: "Obstetrics & Gynecology",
    code: "GYNA",
    description: "High-risk pregnancy care, maternity services, laparoscopic gynecological surgery, and women's health.",
    iconName: "UserPlus",
    active: true
  },
  {
    id: "dept-gastro",
    name: "Gastroenterology",
    code: "GAST",
    description: "Endoscopy, liver diseases, digestive disorders, and gastrointestinal surgery.",
    iconName: "Activity",
    active: true
  },
  {
    id: "dept-genmed",
    name: "General Medicine & Internal Medicine",
    code: "GMED",
    description: "Diagnosis and management of chronic lifestyle diseases, fevers, infections, and preventive health checks.",
    iconName: "Stethoscope",
    active: true
  }
];

export const defaultDoctors: Doctor[] = [
  {
    id: "doc-101",
    userId: "usr-doc-101",
    name: "Dr. Rajesh Sharma",
    email: "doc101@example.com",
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    qualification: "MBBS, MD (General Medicine), DM (Cardiology)",
    designation: "Senior Consultant Cardiologist",
    specialization: "Interventional Cardiology & Heart Failure",
    departmentId: "dept-cardio",
    departmentName: "Cardiology",
    experienceYears: 18,
    bio: "Dr. Rajesh Sharma is a renowned cardiologist with over 18 years of experience in interventional cardiology, cardiac catheterization, and preventive heart care.",
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 700,
    active: true
  },
  {
    id: "doc-102",
    name: "Dr. Ananya Rao",
    photoUrl: "https://images.unsplash.com/photo-1594824813566-88855ce78c00?auto=format&fit=crop&q=80&w=400",
    qualification: "MBBS, MS (Orthopedics), M.Ch (Joint Replacement)",
    designation: "Chief Orthopedic Surgeon",
    specialization: "Robotic Knee & Hip Replacement",
    departmentId: "dept-ortho",
    departmentName: "Orthopedics & Joint Replacement",
    experienceYears: 15,
    bio: "Dr. Ananya Rao specializes in minimally invasive joint replacement surgeries and complex trauma management.",
    languages: ["Kannada", "English"],
    consultationFee: 650,
    active: true
  },
  {
    id: "doc-103",
    name: "Dr. Suresh Kumar",
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    qualification: "MBBS, M.Ch (Neurosurgery), Fellow (Spine)",
    designation: "Lead Neurosurgeon",
    specialization: "Brain Tumor Surgery & Micro-Neurosurgery",
    departmentId: "dept-neuro",
    departmentName: "Neurology & Neurosurgery",
    experienceYears: 14,
    bio: "Dr. Suresh Kumar is an expert in brain tumor excisions, endovascular neurosurgery, and complex spinal disorders.",
    languages: ["Kannada", "English", "Telugu"],
    consultationFee: 800,
    active: true
  },
  {
    id: "doc-104",
    name: "Dr. Priya Deshmukh",
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    qualification: "MBBS, MD (Pediatrics), DNB",
    designation: "Senior Pediatrician",
    specialization: "Pediatric Critical Care & Immunization",
    departmentId: "dept-pedia",
    departmentName: "Pediatrics & Neonatology",
    experienceYears: 12,
    bio: "Dr. Priya Deshmukh is dedicated to child healthcare, pediatric emergency management, and infant nutrition counseling.",
    languages: ["Kannada", "English", "Hindi", "Marathi"],
    consultationFee: 500,
    active: true
  },
  {
    id: "doc-105",
    name: "Dr. Lakshmi Prasad",
    photoUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400",
    qualification: "MBBS, MS (OBG), Fellowship in Reproductive Medicine",
    designation: "Senior Consultant Gynecologist",
    specialization: "High-Risk Obstetrics & Laparoscopy",
    departmentId: "dept-gynaec",
    departmentName: "Obstetrics & Gynecology",
    experienceYears: 16,
    bio: "Dr. Lakshmi Prasad specializes in natural births, laparoscopic uterine surgeries, and adolescent health counseling.",
    languages: ["Kannada", "English"],
    consultationFee: 600,
    active: true
  }
];

export const defaultAvailabilities: DoctorAvailability[] = [
  {
    id: "avail-101",
    doctorId: "doc-101",
    weeklySchedule: [
      {
        dayOfWeek: "Monday",
        slots: [
          { startTime: "09:00 AM", endTime: "01:00 PM" },
          { startTime: "04:00 PM", endTime: "07:00 PM" }
        ]
      },
      {
        dayOfWeek: "Tuesday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }]
      },
      {
        dayOfWeek: "Wednesday",
        slots: [
          { startTime: "09:00 AM", endTime: "01:00 PM" },
          { startTime: "04:00 PM", endTime: "07:00 PM" }
        ]
      },
      {
        dayOfWeek: "Thursday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }]
      },
      {
        dayOfWeek: "Friday",
        slots: [
          { startTime: "09:00 AM", endTime: "01:00 PM" },
          { startTime: "04:00 PM", endTime: "07:00 PM" }
        ]
      },
      {
        dayOfWeek: "Saturday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      }
    ],
    unavailabilities: []
  },
  {
    id: "avail-102",
    doctorId: "doc-102",
    weeklySchedule: [
      {
        dayOfWeek: "Monday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      },
      {
        dayOfWeek: "Wednesday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      },
      {
        dayOfWeek: "Friday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      },
      {
        dayOfWeek: "Saturday",
        slots: [{ startTime: "03:00 PM", endTime: "06:00 PM" }]
      }
    ],
    unavailabilities: []
  },
  {
    id: "avail-103",
    doctorId: "doc-103",
    weeklySchedule: [
      {
        dayOfWeek: "Tuesday",
        slots: [{ startTime: "11:00 AM", endTime: "03:00 PM" }]
      },
      {
        dayOfWeek: "Thursday",
        slots: [{ startTime: "11:00 AM", endTime: "03:00 PM" }]
      },
      {
        dayOfWeek: "Saturday",
        slots: [{ startTime: "11:00 AM", endTime: "03:00 PM" }]
      }
    ],
    unavailabilities: []
  },
  {
    id: "avail-104",
    doctorId: "doc-104",
    weeklySchedule: [
      {
        dayOfWeek: "Monday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "05:00 PM", endTime: "08:00 PM" }]
      },
      {
        dayOfWeek: "Tuesday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }]
      },
      {
        dayOfWeek: "Wednesday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "05:00 PM", endTime: "08:00 PM" }]
      },
      {
        dayOfWeek: "Thursday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }]
      },
      {
        dayOfWeek: "Friday",
        slots: [{ startTime: "09:00 AM", endTime: "01:00 PM" }, { startTime: "05:00 PM", endTime: "08:00 PM" }]
      }
    ],
    unavailabilities: []
  },
  {
    id: "avail-105",
    doctorId: "doc-105",
    weeklySchedule: [
      {
        dayOfWeek: "Monday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      },
      {
        dayOfWeek: "Tuesday",
        slots: [{ startTime: "04:00 PM", endTime: "07:00 PM" }]
      },
      {
        dayOfWeek: "Wednesday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      },
      {
        dayOfWeek: "Friday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      }
    ],
    unavailabilities: []
  }
];

export const defaultServices: ServiceItem[] = [
  {
    id: "srv-1",
    name: "24/7 Emergency & Trauma Care",
    shortDescription: "Immediate medical response with ACLS ambulances and advanced life support ICUs.",
    fullDescription: "Our emergency medicine department is equipped with fully monitored resuscitation bays, emergency operating theaters, and round-the-clock trauma specialists.",
    iconName: "Ambulance",
    displayOrder: 1,
    active: true
  },
  {
    id: "srv-2",
    name: "Comprehensive Diagnostics & Pathology",
    shortDescription: "NABL certified diagnostic lab, 128-slice CT, 3T MRI, and digital X-ray services.",
    fullDescription: "Accurate and rapid diagnostic imaging and blood testing services with digital report access.",
    iconName: "Microscope",
    displayOrder: 2,
    active: true
  },
  {
    id: "srv-3",
    name: "Advanced Surgical Suites",
    shortDescription: "Modular Operation Theatres with HEPA filters and laminar airflow systems.",
    fullDescription: "Equipped for minimally invasive laparoscopic, neurosurgical, cardiac, and orthopedic surgeries.",
    iconName: "Syringe",
    displayOrder: 3,
    active: true
  },
  {
    id: "srv-4",
    name: "Intensive Care Units (ICU / NICU)",
    shortDescription: "State-of-the-art multi-disciplinary ICU, Cardiac ICU, and Neonatal Intensive Care.",
    fullDescription: "1:1 nursing care ratio for critical patients with invasive monitoring and advanced ventilator support.",
    iconName: "Activity",
    displayOrder: 4,
    active: true
  },
  {
    id: "srv-5",
    name: "In-House 24/7 Pharmacy",
    shortDescription: "Genuine medicines, temperature-controlled storage, and bed-side delivery.",
    fullDescription: "Complete prescription pharmacy stocked with critical care, oncology, and daily maintenance drugs.",
    iconName: "Pill",
    displayOrder: 5,
    active: true
  }
];

export const defaultFacilities: FacilityItem[] = [
  {
    id: "fac-1",
    name: "Advanced Critical Care ICUs",
    description: "Dedicated Cardiac, Neonatal, and Surgical ICUs with central telemetry monitoring.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
    displayOrder: 1,
    active: true
  },
  {
    id: "fac-2",
    name: "3T MRI & 128-Slice CT Scanner",
    description: "Ultra-fast, high-resolution diagnostic imaging for precision neurological and cardiac care.",
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
    displayOrder: 2,
    active: true
  },
  {
    id: "fac-3",
    name: "Modular Operation Theatres",
    description: "Infection-controlled ultra-clean operating suits with robotic surgical assistance.",
    imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600",
    displayOrder: 3,
    active: true
  },
  {
    id: "fac-4",
    name: "Deluxe Patient Suites & Private Wards",
    description: "Spacious, comfortable rooms with guest accommodation, nurse call systems, and Wi-Fi.",
    imageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600",
    displayOrder: 4,
    active: true
  }
];

export const getInitialAdminUsers = (): AdminUser[] => [
  {
    id: "usr-superadmin",
    username: "superadmin",
    email: "superadmin@citycarehospital.example.com",
    passwordHash: bcrypt.hashSync("SuperAdmin@123", 10),
    role: "SUPER_ADMIN",
    name: "System Super Admin",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-admin",
    username: "hospitaladmin",
    email: "admin@citycarehospital.example.com",
    passwordHash: bcrypt.hashSync("HospitalAdmin@123", 10),
    role: "HOSPITAL_ADMIN",
    name: "Dr. Hospital Administrator",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-receptionist",
    username: "reception",
    email: "reception@citycarehospital.example.com",
    passwordHash: bcrypt.hashSync("Reception@123", 10),
    role: "RECEPTIONIST",
    name: "Front Desk Receptionist",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-doc-101",
    username: "doc101@example.com",
    email: "doc101@example.com",
    passwordHash: bcrypt.hashSync("Doctor@123", 10),
    role: "DOCTOR",
    name: "Dr. Rajesh Sharma",
    active: true,
    createdAt: new Date().toISOString()
  }
];
