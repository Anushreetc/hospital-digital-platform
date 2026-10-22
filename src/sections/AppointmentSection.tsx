import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Department, Doctor, Appointment } from '../types';
import { publicApi } from '../services/db';
import { isSupabaseConfigured, errorMessage } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { CalendarCheck, CheckCircle2, AlertCircle, Clock, Stethoscope, User, Phone, MessageSquare, Loader2 } from 'lucide-react';

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const addDaysIso = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// One key per booking attempt, so a double-click or network retry cannot create two bookings.
const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
  const [preferredDate, setPreferredDate] = useState(todayIso());
  const [slotTime, setSlotTime] = useState('');
  const [slots, setSlots] = useState<Array<{ time: string; label: string; available: number }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [reason, setReason] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');

  const [availableDocs, setAvailableDocs] = useState<Doctor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const { profile } = useAuth();

  // Prefill from the signed-in patient's profile.
  useEffect(() => {
    if (profile?.role !== 'PATIENT') return;
    if (profile.fullName) setPatientName(name => name || profile.fullName);
    if (profile.phone) setPatientPhone(phone => phone || profile.phone!.replace(/\D/g, '').slice(-10));
  }, [profile]);

  // Live slot availability for the chosen doctor and date.
  useEffect(() => {
    if (!isSupabaseConfigured || !doctorId || !preferredDate) {
      setSlots([]);
      setSlotTime('');
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    publicApi
      .getAvailableSlots(doctorId, preferredDate)
      .then(list => {
        if (cancelled) return;
        setSlots(list);
        setSlotTime(current => (list.some(s => s.time === current && s.available > 0) ? current : list.find(s => s.available > 0)?.time ?? ''));
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctorId, preferredDate, createdAppointment]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured) return setErrorMsg('Online booking is being connected. Please call reception on +91 88677 55541.');
    // Client side validation
    if (!patientName.trim()) return setErrorMsg('Please enter your full name.');
    const digits = patientPhone.replace(/\D/g, '');
    if (digits.length !== 10) return setErrorMsg('Please enter a valid 10-digit mobile number.');
    if (!departmentId) return setErrorMsg('Please select a department.');
    if (!doctorId) return setErrorMsg('Please select a doctor.');
    if (!preferredDate) return setErrorMsg('Please select an appointment date.');
    if (!slotTime) return setErrorMsg('Please choose an available time slot.');
    if (!reason.trim()) return setErrorMsg('Please enter a reason for your visit.');

    setSubmitting(true);
    try {
      const appt = await publicApi.bookAppointment({
        doctorId,
        date: preferredDate,
        slotTime,
        patientName: patientName.trim(),
        patientPhone: digits,
        reason: reason.trim(),
        additionalMessage: additionalMessage.trim() || undefined,
        idempotencyKey,
      });

      setCreatedAppointment(appt);
      setIdempotencyKey(newIdempotencyKey());
      setReason('');
      setAdditionalMessage('');
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Failed to submit appointment. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="appointment" className="py-12 sm:py-20 bg-gradient-to-b from-white via-slate-50 to-blue-50/50 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] xs:text-xs font-bold uppercase tracking-wider">
            Online OPD Booking
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
            Schedule Doctor Consultation
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-slate-600">
            Select your department, doctor, date and available OPD slot. Your request goes directly to reception for review. A booking reference appears after successful submission.
          </p>
        </div>

        {/* Confirmation Success Card */}
        {createdAppointment ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-8 border border-emerald-200 shadow-xl text-center space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <span className="text-[10px] xs:text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 xs:px-3 py-1 rounded-full border border-emerald-200">
                {createdAppointment.status === 'CONFIRMED' ? 'Appointment Confirmed' : 'Booking Request Received'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 break-words">
                Booking ID: <span className="text-blue-600 font-mono">{createdAppointment.code}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Thank you <strong className="text-slate-800">{createdAppointment.patientName}</strong>! Your appointment with <strong className="text-slate-800">{createdAppointment.doctorName}</strong> ({createdAppointment.departmentName}) has been received for <strong className="text-slate-800">{createdAppointment.preferredDate} at {createdAppointment.preferredTime}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-xs text-slate-600 text-left space-y-1.5 border border-slate-100">
              <div className="flex justify-between"><span>Patient Phone:</span> <span className="font-semibold text-slate-900">{createdAppointment.patientPhone}</span></div>
              <div className="flex justify-between"><span>OPD Token Number:</span> <span className="font-bold text-slate-900">{createdAppointment.tokenNumber}</span></div>
              <div className="flex justify-between"><span>Booking Status:</span> <span className="font-bold text-blue-600">{createdAppointment.status === 'CONFIRMED' ? 'CONFIRMED' : 'AWAITING CONFIRMATION'}</span></div>
            </div>
            {createdAppointment.status !== 'CONFIRMED' && (
              <p className="text-xs text-slate-600">
                Our front desk will call you on this number to confirm. <Link to="/login" className="font-bold text-blue-600 hover:underline">Log in with this mobile number</Link> to track your bookings.
              </p>
            )}

            <button
              onClick={() => setCreatedAppointment(null)}
              className="w-full sm:w-auto min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 sm:px-8 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 touch-manipulation cursor-pointer"
            >
              Book Another Appointment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-10 border border-slate-200/80 shadow-xl space-y-4 sm:space-y-6">
            {!isSupabaseConfigured && <div role="status" className="booking-service-note">Online booking is awaiting activation. You can explore the form below or <a href="tel:+918867755541">call reception on +91 88677 55541</a> to arrange your visit.</div>}
            {errorMsg && (
              <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3 text-rose-800 text-xs sm:text-sm font-semibold">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Department */}
              <div className="space-y-1.5">
                <label htmlFor="booking-field-1" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Select Department *
                </label>
                <select id="booking-field-1"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.filter(d => d.active).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div className="space-y-1.5">
                <label htmlFor="booking-field-2" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Select Doctor *
                </label>
                <select id="booking-field-2"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                >
                  <option value="">-- Choose Doctor --</option>
                  {availableDocs.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              {/* Preferred Date */}
              <div className="space-y-1.5">
                <label htmlFor="booking-field-3" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  Preferred Date *
                </label>
                <input id="booking-field-3"
                  type="date"
                  min={todayIso()}
                  max={addDaysIso(todayIso(), 60)}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                />
              </div>

              {/* Preferred Time */}
              <div className="space-y-1.5">
                <label htmlFor="booking-field-4" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Preferred Time Slot *
                </label>
                <select id="booking-field-4"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  required
                  disabled={slotsLoading || slots.length === 0}
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation disabled:opacity-60"
                >
                  {slotsLoading ? (
                    <option value="">Checking availability…</option>
                  ) : !doctorId ? (
                    <option value="">Choose a doctor first</option>
                  ) : slots.length === 0 ? (
                    <option value="">{!isSupabaseConfigured ? "Call reception to confirm availability" : "No OPD on this date — try another day"}</option>
                  ) : (
                    slots.map(s => (
                      <option key={s.time} value={s.time} disabled={s.available <= 0}>
                        {s.label} {s.available <= 0 ? '(full)' : `(${s.available} left)`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Patient Name */}
              <div className="space-y-1.5">
                <label htmlFor="booking-field-5" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Patient Name *
                </label>
                <input id="booking-field-5"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                />
              </div>

              {/* Patient Phone */}
              <div className="space-y-1.5">
                <label htmlFor="booking-field-6" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-600" />
                  10-Digit Mobile Number *
                </label>
                <input id="booking-field-6"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  required
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label htmlFor="booking-field-7" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Reason for Visit / Symptoms *
              </label>
              <textarea id="booking-field-7"
                rows={2}
                placeholder="e.g. Chest tightness, hypertension checkup, joint pain..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured}
                className="w-full min-h-[48px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating & Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-5 h-5" />
                    <span>Send appointment request</span>
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
