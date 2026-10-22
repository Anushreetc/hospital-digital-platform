import React, { createContext, useContext, useEffect, useState } from 'react';
import { Department, Doctor, DoctorAvailability, FacilityItem, HospitalInfo, ServiceItem } from '../types';
import { publicApi } from '../services/db';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fallbackHospitalInfo,
  fallbackDepartments,
  fallbackDoctors,
  fallbackServices,
  fallbackFacilities
} from '../services/mockData';

interface HospitalContextValue {
  hospitalInfo: HospitalInfo;
  departments: Department[];
  doctors: Doctor[];
  services: ServiceItem[];
  facilities: FacilityItem[];
  loading: boolean;
  selectedDoctor: Doctor | null;
  doctorAvail: DoctorAvailability | null;
  preselectedDoctorId: string | undefined;
  setSelectedDoctor: (doc: Doctor | null) => void;
  setPreselectedDoctorId: (id: string | undefined) => void;
  handleSelectDoctorForModal: (doc: Doctor) => Promise<void>;
  handleBookDoctorDirectly: (doctorId: string) => void;
}

const HospitalContext = createContext<HospitalContextValue | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(fallbackHospitalInfo);
  const [departments, setDepartments] = useState<Department[]>(fallbackDepartments);
  const [doctors, setDoctors] = useState<Doctor[]>(fallbackDoctors);
  const [services, setServices] = useState<ServiceItem[]>(fallbackServices);
  const [facilities, setFacilities] = useState<FacilityItem[]>(fallbackFacilities);
  const [loading, setLoading] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorAvail, setDoctorAvail] = useState<DoctorAvailability | null>(null);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    Promise.all([
      publicApi.getHospitalInfo(),
      publicApi.getDepartments(),
      publicApi.getDoctors(),
      publicApi.getServices(),
      publicApi.getFacilities(),
    ])
      .then(([info, depts, docs, srvs, facs]) => {
        if (info) setHospitalInfo(info);
        if (depts?.length) setDepartments(depts);
        if (docs?.length) setDoctors(docs);
        if (srvs?.length) setServices(srvs);
        if (facs?.length) setFacilities(facs);
      })
      .catch(() => {
        // Fallback data remains active
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectDoctorForModal = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    setDoctorAvail(null);
    if (!isSupabaseConfigured) return;
    try {
      setDoctorAvail(await publicApi.getDoctorSchedule(doc.id));
    } catch {
      setDoctorAvail(null);
    }
  };

  const handleBookDoctorDirectly = (doctorId: string) => {
    setPreselectedDoctorId(doctorId);
  };

  return (
    <HospitalContext.Provider
      value={{
        hospitalInfo,
        departments,
        doctors,
        services,
        facilities,
        loading,
        selectedDoctor,
        doctorAvail,
        preselectedDoctorId,
        setSelectedDoctor,
        setPreselectedDoctorId,
        handleSelectDoctorForModal,
        handleBookDoctorDirectly,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error('useHospital must be used within a HospitalProvider');
  return ctx;
};
