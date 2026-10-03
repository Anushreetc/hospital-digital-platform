import { supabase } from './supabaseClient';
import { Appointment, AuthUser } from '../types';

export const supabaseApi = {
  async getPatientAppointments(patientId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctor:doctors(*, department:departments(*))')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async bookAppointment(appt: Omit<Appointment, 'id' | 'status'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id: appt.patientId,
        doctor_id: appt.doctorId,
        preferredDate: appt.preferredDate,
        preferredTime: appt.preferredTime,
        reason: appt.reason,
        status: 'CONFIRMED'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDoctorAppointments(doctorId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:profiles(*)')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select();

    if (error) throw error;
    return data;
  }
};
