import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { FileRepository } from '../repositories/FileRepository';
import { PatientUser, DoctorApplication, AdminUser, UserRole } from '../models/types';

export interface AuthPayload {
  userId: string;
  username?: string;
  email: string;
  role: UserRole;
  name: string;
  doctorId?: string;
}

export class AuthService {
  private fileRepo: FileRepository;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(fileRepo: FileRepository) {
    this.fileRepo = fileRepo;
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_development_only';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // --- PATIENT AUTH ---
  public async patientSignup(dto: {
    name: string;
    email: string;
    phone: string;
    password: string;
    dob?: string;
    gender?: string;
  }): Promise<{ token: string; patient: Omit<PatientUser, 'passwordHash'> }> {
    const existing = this.fileRepo.getPatientByEmail(dto.email);
    if (existing) {
      throw { code: 'DUPLICATE_REQUEST', message: 'An account with this email already exists.' };
    }

    const patient: PatientUser = {
      id: `pat-${Date.now()}`,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      passwordHash: bcrypt.hashSync(dto.password, 10),
      dob: dto.dob,
      gender: dto.gender,
      createdAt: new Date().toISOString()
    };

    this.fileRepo.savePatient(patient);

    const payload: AuthPayload = {
      userId: patient.id,
      email: patient.email,
      role: 'PATIENT',
      name: patient.name
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn as any });
    const { passwordHash, ...safePatient } = patient;
    return { token, patient: safePatient };
  }

  public async patientLogin(email: string, password: string): Promise<{ token: string; patient: Omit<PatientUser, 'passwordHash'> }> {
    const patient = this.fileRepo.getPatientByEmail(email);
    if (!patient) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials.' };
    }

    const isMatch = await bcrypt.compare(password, patient.passwordHash);
    if (!isMatch) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials.' };
    }

    const payload: AuthPayload = {
      userId: patient.id,
      email: patient.email,
      role: 'PATIENT',
      name: patient.name
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn as any });
    const { passwordHash, ...safePatient } = patient;
    return { token, patient: safePatient };
  }

  // --- DOCTOR AUTH & REGISTRATION APPROVAL FLOW ---
  public async doctorSignup(dto: {
    name: string;
    email: string;
    phone: string;
    password: string;
    qualification: string;
    specialization: string;
    designation: string;
    departmentId: string;
    experienceYears: number;
    registrationNumber: string;
    languages: string[];
    bio: string;
    photoUrl?: string;
  }): Promise<{ application: DoctorApplication; message: string }> {
    const existingUser = this.fileRepo.getUserByUsername(dto.email);
    if (existingUser) {
      throw { code: 'DUPLICATE_REQUEST', message: 'A doctor account with this email already exists.' };
    }

    const userId = `usr-doc-${Date.now()}`;
    const hashedPassword = bcrypt.hashSync(dto.password, 10);

    // Save inert user in users repository
    this.fileRepo.saveUser({
      id: userId,
      username: dto.email,
      email: dto.email,
      phone: dto.phone,
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      name: dto.name,
      active: false, // inactive until approved!
      createdAt: new Date().toISOString()
    });

    const dept = this.fileRepo.getDepartmentById(dto.departmentId);

    const application: DoctorApplication = {
      id: `app-doc-${Date.now()}`,
      userId,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      qualification: dto.qualification,
      specialization: dto.specialization,
      designation: dto.designation,
      departmentId: dto.departmentId,
      departmentName: dept ? dept.name : 'General',
      experienceYears: Number(dto.experienceYears) || 1,
      registrationNumber: dto.registrationNumber,
      languages: dto.languages || ['English', 'Kannada'],
      bio: dto.bio,
      photoUrl: dto.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      status: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString()
    };

    this.fileRepo.saveDoctorApplication(application);

    return {
      application,
      message: 'Doctor application submitted successfully! Your account is awaiting Hospital Management review and verification.'
    };
  }

  public async doctorLogin(email: string, password: string): Promise<{ token: string; doctor: any }> {
    const user = this.fileRepo.getUserByUsername(email);
    if (!user || user.role !== 'DOCTOR') {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials or doctor account not found.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials.' };
    }

    if (!user.active) {
      throw { code: 'FORBIDDEN', message: 'Your doctor account is pending verification by Hospital Management.' };
    }

    const doctor = this.fileRepo.getDoctorByUserId(user.id);

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: 'DOCTOR',
      name: user.name,
      doctorId: doctor?.id
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn as any });
    const { passwordHash, ...safeUser } = user;
    return { token, doctor: doctor || safeUser };
  }

  // --- MANAGEMENT AUTH & APPROVAL FLOW ---
  public async managementSignup(dto: {
    hospitalName: string;
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ message: string }> {
    const existing = this.fileRepo.getUserByUsername(dto.email);
    if (existing) {
      throw { code: 'DUPLICATE_REQUEST', message: 'Management account with this email already exists.' };
    }

    const newUser: AdminUser = {
      id: `usr-mgmt-${Date.now()}`,
      username: dto.email,
      email: dto.email,
      phone: dto.phone,
      passwordHash: bcrypt.hashSync(dto.password, 10),
      role: 'HOSPITAL_ADMIN',
      name: dto.name,
      hospitalName: dto.hospitalName,
      status: 'PENDING_VERIFICATION',
      active: false, // requires Super Admin approval!
      createdAt: new Date().toISOString()
    };

    this.fileRepo.saveUser(newUser);

    return {
      message: 'Management registration submitted. Account is pending verification by Super Admin.'
    };
  }

  public async managementLogin(email: string, password: string): Promise<{ token: string; user: Omit<AdminUser, 'passwordHash'> }> {
    const user = this.fileRepo.getUserByUsername(email);
    if (!user || (user.role !== 'HOSPITAL_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'RECEPTIONIST')) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid management credentials.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials.' };
    }

    if (!user.active) {
      throw { code: 'FORBIDDEN', message: 'Management account is pending verification by Super Admin.' };
    }

    const payload: AuthPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn as any });
    const { passwordHash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  public verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthPayload;
    } catch (err) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' };
    }
  }
}
