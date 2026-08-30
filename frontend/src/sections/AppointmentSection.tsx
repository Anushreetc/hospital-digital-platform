import React, { useState, useEffect } from 'react';
import { Department, Doctor, Appointment } from '../types';
import { apiClient } from '../services/apiClient';
import { CalendarCheck, CheckCircle2, AlertCircle, Clock, Stethoscope, User, Phone, MessageSquare, Loader2 } from 'lucide-react';

interface Props {
  departments: Department[];
  doctors: Doctor[];
  preselectedDoctorId?: string;
}

export const AppointmentSection: React.FC<Props> = ({
  departments,
  doctors,
  preselectedDoctorId
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState(preselectedDoctorId || '');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');

  const [availableDocs, setAvailableDocs] = useState<Doctor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (preselectedDoctorId) {
      const doc = doctors.find(d => d.id === preselectedDoctorId);
      if (doc) {
        setDepartmentId(doc.departmentId);
        setDoctorId(doc.id);
      }
    }
  }, [preselectedDoctorId, doctors]);

  useEffect(() => {
    if (departmentId) {
      const docs = doctors.filter(d => d.departmentId === departmentId && d.active);
      setAvailableDocs(docs);
      if (!docs.some(d => d.id === doctorId)) {
        setDoctorId(docs[0]?.id || '');
      }
    } else {
      setAvailableDocs(doctors.filter(d => d.active));
    }
  }, [departmentId, doctors]);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client side validation
    if (!patientName.trim()) return setErrorMsg('Please enter your full name.');
    const digits = patientPhone.replace(/\D/g, '');
    if (digits.length !== 10) return setErrorMsg('Please enter a valid 10-digit mobile number.');
    if (!departmentId) return setErrorMsg('Please select a department.');
    if (!doctorId) return setErrorMsg('Please select a doctor.');
    if (!preferredDate) return setErrorMsg('Please select an appointment date.');
    if (!reason.trim()) return setErrorMsg('Please enter a reason for your visit.');

    setSubmitting(true);
    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const appt = await apiClient.createAppointment({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        departmentId,
        doctorId,
        preferredDate,
        preferredTime,
        reason: reason.trim(),
        additionalMessage: additionalMessage.trim() || undefined,
        source: 'WEBSITE'
      }, idempotencyKey);

      setCreatedAppointment(appt);
      setPatientName('');
      setPatientPhone('');
      setReason('');
      setAdditionalMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="appointment" className="py-20 bg-gradient-to-b from-white via-slate-50 to-blue-50/50 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Online OPD Booking
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Schedule Doctor Consultation
          </h2>
          <p className="text-base text-slate-600">
            Select your preferred department, doctor, and convenient date/time slot. Instant confirmation.
          </p>
        </div>

        {/* Confirmation Success Card */}
        {createdAppointment ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Appointment Booked & Syncing to Hospital Admin
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-3">
                Appointment ID: <span className="text-blue-600 font-mono">{createdAppointment.id}</span>
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                Thank you <strong className="text-slate-800">{createdAppointment.patientName}</strong>! Your appointment with <strong className="text-slate-800">{createdAppointment.doctorName}</strong> ({createdAppointment.departmentName}) has been received for <strong className="text-slate-800">{createdAppointment.preferredDate} at {createdAppointment.preferredTime}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 text-left space-y-1 border border-slate-100">
              <div className="flex justify-between"><span>Patient Phone:</span> <span className="font-semibold text-slate-900">{createdAppointment.patientPhone}</span></div>
              <div className="flex justify-between"><span>Status:</span> <span className="font-bold text-blue-600">{createdAppointment.status}</span></div>
              <div className="flex justify-between"><span>Google Sheets Persistence:</span> <span className="font-semibold text-emerald-700">Saved</span></div>
            </div>

            <button
              onClick={() => setCreatedAppointment(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              Book Another Appointment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Select Department *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.filter(d => d.active).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Select Doctor *
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {availableDocs.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              {/* Preferred Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  Preferred Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preferred Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Preferred Time Slot *
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Patient Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Patient Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Patient Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-600" />
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Reason for Visit / Symptoms *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Chest tightness, hypertension checkup, joint pain..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-base flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating & Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-5 h-5" />
                    <span>Confirm & Book Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
