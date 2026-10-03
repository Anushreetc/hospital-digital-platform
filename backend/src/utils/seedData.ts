import { HospitalInfo, Department, Doctor, DoctorAvailability, ServiceItem, FacilityItem, AdminUser } from '../models/types';
import bcrypt from 'bcryptjs';

export const defaultHospitalInfo: HospitalInfo = {
  name: "We Care Multispeciality Hospital and ICU Doddaballapura",
  tagline: "24/7 Emergency, ICU & Multi-Specialty Care in Doddaballapura",
  address: "We Care Multispeciality Hospital and ICU, D Cross main Rd, near Federal Bank, Doddaballapura, Karnataka - 561203",
  phone: "+91 88677 55541",
  emergencyPhone: "+91 88677 55541",
  ambulancePhone: "+91 93530 61993",
  email: "nandiwecare0@gmail.com",
  operatingHours: "24/7 Open (Round-the-clock Emergency, ICU & Pharmacy)",
  mapEmbedUrl: "https://maps.google.com/maps?q=We+Care+Multispeciality+Hospital+and+ICU+Doddaballapura&t=&z=16&ie=UTF8&iwloc=&output=embed",
  whatsAppNumber: "+91 88677 55541",
  certifications: [
    "24/7 Availability of Doctors",
    "24/7 Emergency & ICU Care",
    "Karnataka-Wide 24/7 Ambulance Fleet",
    "Friendly & Caring Medical Staff"
  ],
  statistics: [
    { label: "Medical Disciplines", value: "12" },
    { label: "Specialist Doctors", value: "13+" },
    { label: "Hospital Bed Capacity", value: "28" },
    { label: "Doctor & ICU Care", value: "24/7" }
  ],
  socials: {
    facebook: "https://facebook.com/nandiwecare",
    twitter: "https://twitter.com/nandiwecare",
    instagram: "https://instagram.com/nandiwecare",
    linkedin: "https://linkedin.com/company/nandiwecare"
  },
  establishedYear: 2023,
  totalBeds: 28,
  directorName: "Mr. Vishnuvardhan (Director)",
  supportedLanguages: [
    "English",
    "Kannada (ಕನ್ನಡ)",
    "Hindi (हिंदी)",
    "Tamil (தமிழ்)",
    "Telugu (తెలుగు)",
    "Malayalam (മലയാളം)",
    "Urdu (اردو)"
  ],
  roomTariffs: [
    {
      category: "General Ward",
      pricePerDay: 2500,
      description: "Comfortable and hygienic inpatient ward with round-the-clock nursing supervision.",
      features: ["24/7 Nursing Care", "Patient Bed & Bedside Locker", "Shared Washroom", "Vital Monitoring"]
    },
    {
      category: "Semi-Private Room",
      pricePerDay: 3500,
      description: "Twin-sharing air-conditioned room with attendant accommodation.",
      features: ["Air Conditioning (AC)", "Dedicated Attendant Bed", "Curtained Privacy", "Regular Doctor Rounds"]
    },
    {
      category: "Private Room",
      pricePerDay: 4000,
      description: "Independent air-conditioned private suite with dedicated patient amenities.",
      features: ["Air Conditioning (AC)", "Attendant Bed", "Private Attached Bathroom", "Television & Nurse Call"]
    },
    {
      category: "Intensive Care Unit (ICU)",
      pricePerDay: 6000,
      description: "Advanced critical care unit managed by multidisciplinary intensivists and high nurse-to-patient ratio.",
      features: ["Air Conditioning (AC)", "Multidisciplinary Critical Care Team", "Advanced Continuous Hemodynamic Monitoring", "High Staff-to-Patient Ratio"]
    }
  ],
  visitingHours: {
    general: "9:00 AM – 11:00 AM & 6:00 PM – 7:00 PM",
    icu: "5:00 PM – 6:00 PM",
    maxVisitors: 2,
    restrictions: [
      "Visitors above 12 years only permitted in inpatient areas",
      "Electric gadgets and flammable items are strictly restricted",
      "All visitors must maintain strict hospital hygiene protocols",
      "Maximum of 2 visitors permitted per patient at any time"
    ]
  },
  insuranceInfo: {
    acceptedTPAs: ["MD India Health Insurance TPA", "Cashless Hospitalization Network"],
    cashlessAvailable: true,
    preAuthRequired: true,
    documentsRequired: [
      "Identity Proof (Aadhaar Card, Voter ID, Passport)",
      "Address Proof",
      "Age Proof",
      "Previous Medical Records & Doctor Prescription",
      "Passport Size Photographs",
      "Duly Filled Insurance Pre-Authorization / Proposal Form"
    ],
    paymentMethods: ["Cash", "UPI (GPay / PhonePe / Paytm)", "Debit Card", "Credit Card", "Net Banking"]
  }
};

export const defaultDepartments: Department[] = [
  {
    id: "dept-ortho",
    name: "Department of Orthopaedics",
    code: "ORTH",
    description: "Expert care for bone fractures, joint pain, arthritis, spinal care, and orthopedic surgical interventions.",
    iconName: "Bone",
    active: true
  },
  {
    id: "dept-gynaec",
    name: "Department of Gynaecology & Obstetrics",
    code: "GYNA",
    description: "Comprehensive maternity services, antenatal & postnatal care, normal deliveries, and women's wellness.",
    iconName: "UserPlus",
    active: true
  },
  {
    id: "dept-pulmo",
    name: "Department of Pulmonology",
    code: "PULM",
    description: "Specialized treatment for asthma, COPD, chronic cough, respiratory infections, and lung conditions.",
    iconName: "Wind",
    active: true
  },
  {
    id: "dept-gastro",
    name: "Department of Gastroenterology",
    code: "GAST",
    description: "Digestive health, liver disease management, abdominal pain, gastrointestinal disorders, and endoscopy evaluations.",
    iconName: "Activity",
    active: true
  },
  {
    id: "dept-pedia",
    name: "Department of Pediatrics",
    code: "PEDI",
    description: "Dedicated child healthcare, pediatric illness management, newborn follow-up, and routine vaccination schedules.",
    iconName: "Baby",
    active: true
  },
  {
    id: "dept-nephro",
    name: "Department of Nephrology",
    code: "NEPH",
    description: "Kidney disease management, renal assessments, hypertension-related kidney disorders, and clinical nephrology.",
    iconName: "Shield",
    active: true
  },
  {
    id: "dept-ent",
    name: "Department of ENT",
    code: "ENT",
    description: "Diagnosis and treatments for ear infections, hearing problems, nasal blockage, sinusitis, and throat conditions.",
    iconName: "Headphones",
    active: true
  },
  {
    id: "dept-neuro",
    name: "Department of Neurology & Neurosurgery",
    code: "NEUR",
    description: "Advanced management for stroke, headache, epilepsy, neuropathy, spine disorders, and neurosurgical emergencies.",
    iconName: "Brain",
    active: true
  },
  {
    id: "dept-gensurg",
    name: "Department of General Surgery",
    code: "GSUR",
    description: "General and emergency surgical care, hernia repair, appendicitis, trauma care, and wound management.",
    iconName: "Scissors",
    active: true
  },
  {
    id: "dept-genmed",
    name: "Department of General Medicine",
    code: "GMED",
    description: "Comprehensive primary and internal medicine, fevers, diabetes, hypertension, and preventive health screenings.",
    iconName: "Stethoscope",
    active: true
  },
  {
    id: "dept-uro",
    name: "Department of Urology",
    code: "UROL",
    description: "Urinary tract infections, kidney stones, prostate disorders, bladder issues, and urological surgical care.",
    iconName: "Droplets",
    active: true
  },
  {
    id: "dept-derm",
    name: "Department of Dermatology",
    code: "DERM",
    description: "Clinical skin condition management, acne, psoriasis, allergies, fungal infections, hair, and nail treatments.",
    iconName: "Sparkles",
    active: true
  }
];

export const defaultDoctors: Doctor[] = [
  {
    id: "doc-101",
    userId: "usr-doc-101",
    name: "Dr. Chiranjeevi Ks",
    qualification: "MBBS, DNB",
    designation: "Consultant Physician",
    departmentId: "dept-genmed",
    departmentName: "Department of General Medicine",
    specialization: "General Medicine & Internal Care",
    experienceYears: 10,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 400,
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    bio: "Dr. Chiranjeevi Ks brings extensive clinical experience in general medicine, acute fevers, metabolic care, and adult primary care.",
    active: true
  },
  {
    id: "doc-102",
    name: "Dr. Rameshwari",
    qualification: "MBBS, DCH, DNB, PGPN",
    designation: "Consultant Pediatrician",
    departmentId: "dept-pedia",
    departmentName: "Department of Pediatrics",
    specialization: "Pediatric Care & Child Nutrition",
    experienceYears: 12,
    languages: ["Kannada", "English", "Telugu"],
    consultationFee: 450,
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    bio: "Specialist in pediatric developmental health, infant nutrition, pediatric infectious diseases, and childhood immunization.",
    active: true
  },
  {
    id: "doc-103",
    name: "Dr. Rajeev",
    qualification: "MBBS, MS (Ortho)",
    designation: "Consultant Orthopedic Surgeon",
    departmentId: "dept-ortho",
    departmentName: "Department of Orthopaedics",
    specialization: "Orthopedic Surgery & Trauma Care",
    experienceYears: 14,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 500,
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    bio: "Experienced orthopedic surgeon specializing in trauma fracture management, joint care, and musculoskeletal emergencies.",
    active: true
  },
  {
    id: "doc-104",
    name: "Dr. Sri Harsha",
    qualification: "MBBS, MS, DNB",
    designation: "Consultant General & Laparoscopic Surgeon",
    departmentId: "dept-gensurg",
    departmentName: "Department of General Surgery",
    specialization: "General & Laparoscopic Surgery",
    experienceYears: 11,
    languages: ["Kannada", "English", "Telugu"],
    consultationFee: 500,
    photoUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    bio: "Specializes in abdominal surgical interventions, hernia repair, appendectomy, emergency surgery, and wound management.",
    active: true
  },
  {
    id: "doc-105",
    name: "Dr. Manasa",
    qualification: "MBBS, DGO / MS (OBG)",
    designation: "Consultant Gynaecologist & Obstetrician",
    departmentId: "dept-gynaec",
    departmentName: "Department of Gynaecology & Obstetrics",
    specialization: "Obstetrics, Maternity & Women's Health",
    experienceYears: 9,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 450,
    photoUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400",
    bio: "Devoted to high-quality antenatal care, normal delivery assistance, reproductive wellness, and adolescent gynecological care.",
    active: true
  },
  {
    id: "doc-106",
    name: "Dr. Swarag",
    qualification: "MBBS, MS (ENT)",
    designation: "Consultant ENT Surgeon",
    departmentId: "dept-ent",
    departmentName: "Department of ENT",
    specialization: "Ear, Nose & Throat Disorders",
    experienceYears: 8,
    languages: ["Kannada", "English"],
    consultationFee: 400,
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    bio: "Expertise in managing sinusitis, allergic rhinitis, ear infections, throat disorders, and pediatric ENT consultations.",
    active: true
  },
  {
    id: "doc-107",
    name: "Dr. Ravikiran",
    qualification: "MBBS, MD, DM",
    designation: "Consultant Nephrologist & Super Specialist",
    departmentId: "dept-nephro",
    departmentName: "Department of Nephrology",
    specialization: "Nephrology & Renal Medicine",
    experienceYears: 15,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 650,
    photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400",
    bio: "Super specialist handling complex kidney conditions, chronic renal disorders, electrolyte abnormalities, and hypertension.",
    active: true
  },
  {
    id: "doc-108",
    name: "Dr. Amod",
    qualification: "MBBS, MD, IDCCM",
    designation: "Critical Care Specialist & Intensivist",
    departmentId: "dept-genmed",
    departmentName: "Department of General Medicine",
    specialization: "Critical Care Medicine & ICU Lead",
    experienceYears: 13,
    languages: ["Kannada", "English", "Hindi", "Marathi"],
    consultationFee: 600,
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    bio: "Intensive care expert overseeing multi-disciplinary ICU admissions, mechanical ventilation, and hemodynamic stabilization.",
    active: true
  },
  {
    id: "doc-109",
    name: "Dr. Sudarshan",
    qualification: "MBBS, MD (Dermatology)",
    designation: "Consultant Dermatologist",
    departmentId: "dept-derm",
    departmentName: "Department of Dermatology",
    specialization: "Clinical Dermatology & Skin Disorders",
    experienceYears: 10,
    languages: ["Kannada", "English"],
    consultationFee: 400,
    photoUrl: "https://images.unsplash.com/photo-1594824813566-88855ce78c00?auto=format&fit=crop&q=80&w=400",
    bio: "Skilled dermatologist treating psoriasis, eczema, skin infections, hair loss, and cosmetic skin care.",
    active: true
  },
  {
    id: "doc-110",
    name: "Dr. Ramya Reddy",
    qualification: "BDS, MDS",
    designation: "Dental & Maxillofacial Specialist",
    departmentId: "dept-gensurg",
    departmentName: "Department of General Surgery",
    specialization: "Oral & Maxillofacial Care",
    experienceYears: 9,
    languages: ["Kannada", "English", "Telugu"],
    consultationFee: 350,
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    bio: "Specializes in comprehensive oral health, facial trauma assessments, dental procedures, and surgical extractions.",
    active: true
  },
  {
    id: "doc-111",
    name: "Dr. Vishwanth",
    qualification: "MBBS, MS, MCH (Urology)",
    designation: "Consultant Urologist & Andrologist",
    departmentId: "dept-uro",
    departmentName: "Department of Urology",
    specialization: "Urological Surgery & Stone Management",
    experienceYears: 16,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 700,
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    bio: "Super specialist surgeon for kidney stone extraction, prostate disease treatment, and reconstructive urology.",
    active: true
  },
  {
    id: "doc-112",
    name: "Dr. Ganesh Prathap",
    qualification: "MBBS, DTCD / DNB (Resp)",
    designation: "Consultant Pulmonologist",
    departmentId: "dept-pulmo",
    departmentName: "Department of Pulmonology",
    specialization: "Pulmonology & Chest Medicine",
    experienceYears: 12,
    languages: ["Kannada", "English", "Hindi"],
    consultationFee: 500,
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    bio: "Experienced chest physician diagnosing respiratory distress, allergic asthma, sleep apnea, and lung diseases.",
    active: true
  },
  {
    id: "doc-113",
    name: "Dr. Hariprakash",
    qualification: "MBBS, M.Ch (Neurosurgery)",
    designation: "Consultant Neurosurgeon",
    departmentId: "dept-neuro",
    departmentName: "Department of Neurology & Neurosurgery",
    specialization: "Neurosurgery & Neurotrauma",
    experienceYears: 15,
    languages: ["Kannada", "English"],
    consultationFee: 700,
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    bio: "Consultant neurosurgeon with extensive expertise in head injury management, spine care, and critical neurosurgical emergencies.",
    active: true
  }
];

export const defaultAvailabilities: DoctorAvailability[] = defaultDoctors.map((doc, idx) => {
  const morningStart = idx % 2 === 0 ? "09:00 AM" : "10:00 AM";
  const morningEnd = idx % 2 === 0 ? "01:00 PM" : "02:00 PM";
  const eveningStart = "05:00 PM";
  const eveningEnd = "08:00 PM";

  return {
    id: `avail-${doc.id}`,
    doctorId: doc.id,
    weeklySchedule: [
      {
        dayOfWeek: "Monday",
        slots: [
          { startTime: morningStart, endTime: morningEnd },
          { startTime: eveningStart, endTime: eveningEnd }
        ]
      },
      {
        dayOfWeek: "Tuesday",
        slots: [{ startTime: morningStart, endTime: morningEnd }]
      },
      {
        dayOfWeek: "Wednesday",
        slots: [
          { startTime: morningStart, endTime: morningEnd },
          { startTime: eveningStart, endTime: eveningEnd }
        ]
      },
      {
        dayOfWeek: "Thursday",
        slots: [{ startTime: morningStart, endTime: morningEnd }]
      },
      {
        dayOfWeek: "Friday",
        slots: [
          { startTime: morningStart, endTime: morningEnd },
          { startTime: eveningStart, endTime: eveningEnd }
        ]
      },
      {
        dayOfWeek: "Saturday",
        slots: [{ startTime: "10:00 AM", endTime: "02:00 PM" }]
      }
    ],
    unavailabilities: []
  };
});

export const defaultServices: ServiceItem[] = [
  {
    id: "srv-1",
    name: "24/7 Emergency & Casualty Care",
    shortDescription: "Immediate emergency triage, trauma resuscitation, burns care, and emergency surgery around the clock.",
    fullDescription: "Operates 24/7 to deliver rapid assessment, stabilization, and multidisciplinary treatment for critical illnesses and major traumas with on-call specialists.",
    iconName: "Ambulance",
    displayOrder: 1,
    active: true
  },
  {
    id: "srv-2",
    name: "ICU & Critical Care Unit",
    shortDescription: "Multi-disciplinary 24/7 intensive care with advanced hemodynamic monitoring and high nurse-to-patient ratio.",
    fullDescription: "Dedicated critical care infrastructure staffed by trained intensivists for post-operative recovery, cardiac crises, and critical respiratory emergencies.",
    iconName: "Activity",
    displayOrder: 2,
    active: true
  },
  {
    id: "srv-3",
    name: "General & Emergency Surgery",
    shortDescription: "Modular Operation Theatre for emergency surgery, appendectomy, hernia, and acute surgical interventions.",
    fullDescription: "Infection-controlled operating environment equipped for abdominal, orthopedic, urological, and trauma surgical procedures.",
    iconName: "Syringe",
    displayOrder: 3,
    active: true
  },
  {
    id: "srv-4",
    name: "Maternity & Obstetrics Care",
    shortDescription: "Safe deliveries, prenatal and postnatal monitoring, and comprehensive mother-child care.",
    fullDescription: "Compassionate maternal healthcare supporting antenatal visits, fetal heart tracking, labor suites, and postnatal infant guidance.",
    iconName: "Baby",
    displayOrder: 4,
    active: true
  },
  {
    id: "srv-5",
    name: "Child Vaccination & Preventive Health",
    shortDescription: "Pediatric immunizations, infant growth tracking, and complete preventive health checkup packages.",
    fullDescription: "Full range of government and optional childhood vaccines, wellness assessments, diabetes screening, and routine health evaluations.",
    iconName: "Shield",
    displayOrder: 5,
    active: true
  },
  {
    id: "srv-6",
    name: "24/7 Diagnostic Pathology & Lab",
    shortDescription: "In-house blood and urine diagnostic tests with guaranteed Same-Day digital report delivery.",
    fullDescription: "Equipped for complete blood counts, biochemical profiles, renal and liver function panels, urinalysis, and emergency cardiac biomarkers.",
    iconName: "Microscope",
    displayOrder: 6,
    active: true
  },
  {
    id: "srv-7",
    name: "Digital X-Ray & ECG Diagnostics",
    shortDescription: "High-resolution digital radiology and 12-lead ECG evaluations available 24/7.",
    fullDescription: "Immediate imaging for bone fractures, chest diagnostics, abdominal conditions, and rapid ECG readings for cardiac symptoms.",
    iconName: "Activity",
    displayOrder: 7,
    active: true
  }
];

export const defaultFacilities: FacilityItem[] = [
  {
    id: "fac-1",
    name: "Intensive Care Unit (ICU)",
    description: "24/7 multi-disciplinary ICU with continuous physiological monitoring, ventilators, and high nurse-to-patient ratio.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
    displayOrder: 1,
    active: true
  },
  {
    id: "fac-2",
    name: "Modern Operation Theatre (OT)",
    description: "Infection-controlled surgical suite designed for elective, trauma, and round-the-clock emergency surgical procedures.",
    imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600",
    displayOrder: 2,
    active: true
  },
  {
    id: "fac-3",
    name: "In-House 24/7 Pharmacy",
    description: "Fully stocked round-the-clock medical store dispensing authentic prescriptions, emergency injectables, and surgical consumables.",
    imageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600",
    displayOrder: 3,
    active: true
  },
  {
    id: "fac-4",
    name: "24/7 Ambulance Fleet (Karnataka-Wide)",
    description: "Emergency ambulance service available 24/7 covering Doddaballapura and all across Karnataka (Call: +91 93530 61993).",
    imageUrl: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&q=80&w=600",
    displayOrder: 4,
    active: true
  },
  {
    id: "fac-5",
    name: "Patient Amenities & Full Accessibility",
    description: "Dedicated patient parking, wheelchair ramps, elevators, accessible restrooms, and comfortable air-conditioned waiting lounges.",
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
    displayOrder: 5,
    active: true
  }
];

export const getInitialAdminUsers = (): AdminUser[] => [
  {
    id: "usr-superadmin",
    username: "superadmin",
    email: "superadmin@wecarehospital.in",
    passwordHash: bcrypt.hashSync("SuperAdmin@123", 10),
    role: "SUPER_ADMIN",
    name: "System Super Admin",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-admin",
    username: "director",
    email: "nandiwecare0@gmail.com",
    passwordHash: bcrypt.hashSync("WeCare@123", 10),
    role: "HOSPITAL_ADMIN",
    name: "Mr. Vishnuvardhan (Director)",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-receptionist",
    username: "reception",
    email: "reception@wecarehospital.in",
    passwordHash: bcrypt.hashSync("Reception@123", 10),
    role: "RECEPTIONIST",
    name: "Front Desk Receptionist",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-doc-101",
    username: "doc101@wecarehospital.in",
    email: "doc101@wecarehospital.in",
    passwordHash: bcrypt.hashSync("Doctor@123", 10),
    role: "DOCTOR",
    name: "Dr. Chiranjeevi Ks",
    active: true,
    createdAt: new Date().toISOString()
  }
];
