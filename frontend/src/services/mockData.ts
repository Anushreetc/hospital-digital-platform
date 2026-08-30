import { HospitalInfo, Department, Doctor, ServiceItem, FacilityItem } from '../types';

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
    name: "Pediatrics & Neonatology",
    code: "PEDI",
    description: "Specialized pediatric care, NICU facilities, childhood vaccination, and growth monitoring.",
    iconName: "Baby",
    active: true
  },
  {
    id: "dept-5",
    name: "General & Internal Medicine",
    code: "MED",
    description: "Holistic diagnosis and treatment of acute and chronic adult medical conditions.",
    iconName: "Stethoscope",
    active: true
  }
];

export const fallbackDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Ramesh H. S.",
    qualification: "MBBS, MD, DM (Cardiology)",
    designation: "Chief Interventional Cardiologist",
    departmentId: "dept-1",
    departmentName: "Cardiology",
    specialization: "Cardiology",
    experienceYears: 18,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 700,
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    bio: "Pioneer in transradial coronary angiography and structural heart interventions with over 18 years of clinical experience.",
    active: true
  },
  {
    id: "doc-2",
    name: "Dr. Ananya Rao",
    qualification: "MBBS, MS, MCh (Neurosurgery)",
    designation: "Senior Consultant Neurosurgeon",
    departmentId: "dept-2",
    departmentName: "Neurology & Neurosurgery",
    specialization: "Neurology",
    experienceYears: 14,
    languages: ["Kannada", "English"],
    consultationFee: 800,
    photoUrl: "https://images.unsplash.com/photo-1594824813639-4972d3e33f38?auto=format&fit=crop&q=80&w=400",
    bio: "Specializes in minimally invasive skull base surgery and complex spinal reconstruction.",
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
  }
];

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
