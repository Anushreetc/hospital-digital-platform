import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ClipboardList, Copy, Loader2, Pencil, Plus, Printer, Search, Trash2, UserRound } from 'lucide-react';
import { patientsApi } from '../services/db';
import { errorMessage } from '../lib/supabase';
import { Consultation, ConsultationInput, PatientGender, PatientRecord, PatientSummary, PrescriptionItem, Vitals } from '../types';

/**
 * Patient search, visit history and (for doctors) prescription entry.
 * Search by 10-digit mobile number opens the patient directly when only one
 * person uses that number; a family sharing a phone shows as a short list.
 * Doctors see medical content; reception/admin see details and visit dates only
 * (enforced by the database, not just this screen).
 */

interface Props {
  /** Doctors can write prescriptions and see medical content. */
  isDoctor: boolean;
  /** Open this patient straight away (e.g. from the doctor's queue). */
  initialPatientId?: string;
  /** Booking the new visit belongs to, when opened from the queue. */
  initialAppointmentId?: string;
}

const FREQUENCIES = ['1-0-1', '1-0-0', '0-0-1', '0-1-0', '1-1-1', '1-1-1-1', 'SOS', 'Once a week'];
const TIMINGS = ['After food', 'Before food', 'With food', 'Empty stomach', 'Bedtime'];
const GENDER_LABEL: Record<PatientGender, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

const formatDate = (iso?: string) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const emptyItem = (): PrescriptionItem => ({ medicine: '', dose: '', frequency: '', timing: '', notes: '' });

const inputCls = 'w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#195fbd]';
const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1';

export const PatientRecords: React.FC<Props> = ({ isDoctor, initialPatientId, initialAppointmentId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ visit?: Consultation; appointmentId?: string } | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | undefined>(initialAppointmentId);

  const openPatient = async (id: string) => {
    setLoadingRecord(true);
    setError(null);
    try {
      setRecord(await patientsApi.getRecord(id));
    } catch (err) {
      setError(errorMessage(err, 'Could not open the patient record.'));
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => {
    if (initialPatientId) {
      setAppointmentId(initialAppointmentId);
      setEditing(null);
      void openPatient(initialPatientId);
    }
  }, [initialPatientId, initialAppointmentId]);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const found = await patientsApi.search(q);
      const digits = q.replace(/\D/g, '');
      // A full mobile number used by one person opens their record directly.
      if (found.length === 1 && digits.length >= 10 && !/[a-z]/i.test(q)) {
        setResults(found);
        setAppointmentId(undefined);
        await openPatient(found[0].id);
      } else {
        setRecord(null);
        setResults(found);
      }
    } catch (err) {
      setError(errorMessage(err, 'Search failed.'));
    } finally {
      setSearching(false);
    }
  };

  if (editing && record) {
    return (
      <ConsultationForm
        record={record}
        visit={editing.visit}
        appointmentId={editing.appointmentId}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          setAppointmentId(undefined);
          await openPatient(record.patient.id);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={runSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mobile number, patient ID (WC-00012) or name"
            className={`${inputCls} pl-9 py-2.5`}
            inputMode="search"
            aria-label="Search patients"
          />
        </div>
        <button type="submit" disabled={searching || query.trim().length < 2} className="px-5 py-2.5 bg-[#195fbd] hover:bg-[#124a96] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold">{error}</div>}

      {loadingRecord && <div className="animate-pulse h-48 bg-slate-200 rounded-2xl" />}

      {!loadingRecord && record && (
        <PatientView
          record={record}
          isDoctor={isDoctor}
          appointmentId={appointmentId}
          onBack={results && results.length > 1 ? () => setRecord(null) : undefined}
          onNewVisit={() => setEditing({ appointmentId })}
          onEditVisit={(visit) => setEditing({ visit })}
          onDetailsSaved={() => openPatient(record.patient.id)}
        />
      )}

      {!loadingRecord && !record && results && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {results.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">
              No patient found. Patients are added automatically when a booking is made with their name and mobile number.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((p) => (
                <li key={p.id}>
                  <button onClick={() => { setAppointmentId(undefined); void openPatient(p.id); }} className="w-full text-left p-4 hover:bg-slate-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#195fbd] flex items-center justify-center shrink-0">
                      <UserRound className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#10294c] truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.code} · {p.phone}
                        {p.age != null && ` · ${p.age} yrs`}
                        {p.gender && ` · ${GENDER_LABEL[p.gender]}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500 hidden sm:block">
                      {p.lastVisit ? <>Last: {formatDate(p.lastVisit)}<br />{p.lastDoctor}</> : 'No visits yet'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loadingRecord && !record && !results && (
        <p className="text-sm text-slate-500 text-center py-6">
          Enter the patient's mobile number to open their record. Name and patient ID also work.
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const PatientView: React.FC<{
  record: PatientRecord;
  isDoctor: boolean;
  appointmentId?: string;
  onBack?: () => void;
  onNewVisit: () => void;
  onEditVisit: (v: Consultation) => void;
  onDetailsSaved: () => void;
}> = ({ record, isDoctor, appointmentId, onBack, onNewVisit, onEditVisit, onDetailsSaved }) => {
  const { patient, visits, bookings } = record;
  const [editDetails, setEditDetails] = useState(false);
  const [gender, setGender] = useState<PatientGender | ''>(patient.gender ?? '');
  const [age, setAge] = useState(patient.age != null ? String(patient.age) : '');
  const [saving, setSaving] = useState(false);
  const linkedVisitExists = appointmentId ? visits.some((v) => v.appointmentId === appointmentId) : false;

  const saveDetails = async () => {
    setSaving(true);
    try {
      const years = age.trim() ? Number(age) : null;
      const birthYear = years != null && years >= 0 && years < 130 ? new Date().getFullYear() - years : null;
      await patientsApi.updateDetails(patient.id, gender, birthYear);
      setEditDetails(false);
      onDetailsSaved();
    } catch (err) {
      alert(errorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="self-start p-2 rounded-xl hover:bg-slate-100 text-slate-500" aria-label="Back to results">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#195fbd]">{patient.code}</p>
            <h3 className="text-2xl font-bold text-[#10294c]">{patient.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {patient.phone}
              {patient.age != null && ` · ${patient.age} yrs`}
              {patient.gender && ` · ${GENDER_LABEL[patient.gender]}`}
              {' · '}{visits.length} visit{visits.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditDetails((v) => !v)} className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              Age / gender
            </button>
            {isDoctor && (
              <button onClick={onNewVisit} className="px-4 py-2 text-xs font-bold rounded-xl bg-[#195fbd] hover:bg-[#124a96] text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> New visit &amp; prescription
              </button>
            )}
          </div>
        </div>
        {editDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end gap-3">
            <div>
              <label className={labelCls}>Age (years)</label>
              <input type="number" min={0} max={129} value={age} onChange={(e) => setAge(e.target.value)} className={`${inputCls} w-28`} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as PatientGender | '')} className={`${inputCls} w-36`}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button onClick={saveDetails} disabled={saving} className="px-4 py-2 text-xs font-bold rounded-xl bg-[#195fbd] text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
        {isDoctor && appointmentId && !linkedVisitExists && (
          <p className="mt-4 text-xs font-semibold text-[#195fbd] bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            Opened from today's queue. "New visit &amp; prescription" will be linked to this booking.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-[#10294c] flex items-center gap-2"><ClipboardList className="w-5 h-5 text-slate-400" /> Visit history</h4>
          {visits.length === 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-sm text-slate-500 text-center">No visits recorded yet.</div>
          )}
          {visits.map((v) => (
            <VisitCard key={v.id} visit={v} patient={patient} isDoctor={isDoctor} onEdit={() => onEditVisit(v)} />
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-[#10294c]">Bookings</h4>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {bookings.length === 0 && <p className="p-4 text-sm text-slate-500">No bookings.</p>}
            {bookings.map((b) => (
              <div key={b.id} className="p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-[#10294c]">{formatDate(b.date)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-500">{b.time} · {b.doctorName}</p>
                {b.reason && <p className="text-xs text-slate-600 mt-0.5">{b.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const VisitCard: React.FC<{ visit: Consultation; patient: PatientRecord['patient']; isDoctor: boolean; onEdit: () => void }> = ({ visit, patient, isDoctor, onEdit }) => {
  const vitals = visit.vitals ?? {};
  const vitalText = [
    vitals.bp && `BP ${vitals.bp}`,
    vitals.pulse && `Pulse ${vitals.pulse}`,
    vitals.temperature && `Temp ${vitals.temperature}`,
    vitals.weight && `Wt ${vitals.weight} kg`,
    vitals.spo2 && `SpO₂ ${vitals.spo2}%`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[#10294c]">{formatDate(visit.visitDate)}</p>
          <p className="text-xs text-slate-500">{visit.doctorName}{visit.doctorDesignation && ` · ${visit.doctorDesignation}`}</p>
        </div>
        {isDoctor && (
          <div className="flex gap-1.5">
            {visit.isMine && (
              <button onClick={onEdit} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Edit visit"><Pencil className="w-4 h-4" /></button>
            )}
            <button onClick={() => printPrescription(patient, visit)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Print prescription"><Printer className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {!isDoctor ? (
        <p className="text-xs text-slate-500">Medical details are visible to doctors only.</p>
      ) : (
        <>
          {visit.complaint && <Field label="Complaint" value={visit.complaint} />}
          {vitalText && <Field label="Vitals" value={vitalText} />}
          {visit.findings && <Field label="Findings" value={visit.findings} />}
          {visit.diagnosis && <Field label="Diagnosis" value={visit.diagnosis} />}
          {visit.items && visit.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="p-2">Medicine</th><th className="p-2">Dose</th><th className="p-2">When</th>
                    <th className="p-2">Food</th><th className="p-2">Days</th><th className="p-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visit.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold text-[#10294c]">{i.medicine}</td><td className="p-2">{i.dose}</td>
                      <td className="p-2">{i.frequency}</td><td className="p-2">{i.timing}</td>
                      <td className="p-2">{i.durationDays ?? ''}</td><td className="p-2">{i.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {visit.advice && <Field label="Advice" value={visit.advice} />}
          {visit.followUpDate && <Field label="Follow-up" value={formatDate(visit.followUpDate)} />}
        </>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
  </div>
);

// ---------------------------------------------------------------------------

const ConsultationForm: React.FC<{
  record: PatientRecord;
  visit?: Consultation;
  appointmentId?: string;
  onCancel: () => void;
  onSaved: () => void;
}> = ({ record, visit, appointmentId, onCancel, onSaved }) => {
  const { patient } = record;
  const [complaint, setComplaint] = useState(visit?.complaint ?? '');
  const [findings, setFindings] = useState(visit?.findings ?? '');
  const [vitals, setVitals] = useState<Vitals>(visit?.vitals ?? {});
  const [diagnosis, setDiagnosis] = useState(visit?.diagnosis ?? '');
  const [advice, setAdvice] = useState(visit?.advice ?? '');
  const [followUp, setFollowUp] = useState(visit?.followUpDate ?? '');
  const [items, setItems] = useState<PrescriptionItem[]>(visit?.items?.length ? visit.items : [emptyItem()]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestTimer = useRef<number>();

  const lastWithMedicines = record.visits.find((v) => v.id !== visit?.id && v.items && v.items.length > 0);

  const setItem = (idx: number, patch: Partial<PrescriptionItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    if (patch.medicine !== undefined) {
      window.clearTimeout(suggestTimer.current);
      const prefix = patch.medicine;
      suggestTimer.current = window.setTimeout(() => {
        patientsApi.medicineSuggestions(prefix).then(setSuggestions).catch(() => setSuggestions([]));
      }, 250);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input: ConsultationInput = {
      id: visit?.id,
      patientId: patient.id,
      appointmentId: visit ? undefined : appointmentId,
      complaint, findings, vitals, diagnosis, advice,
      followUpDate: followUp || undefined,
      items: items.filter((i) => i.medicine.trim()),
    };
    try {
      await patientsApi.saveConsultation(input);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the visit.'));
    } finally {
      setSaving(false);
    }
  };

  const vital = (key: keyof Vitals, label: string, placeholder: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input value={vitals[key] ?? ''} onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))} placeholder={placeholder} maxLength={20} className={inputCls} />
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500" aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#195fbd]">{visit ? 'Edit visit' : 'New visit'} · {patient.code}</p>
          <h3 className="text-xl font-bold text-[#10294c]">{patient.name}</h3>
          <p className="text-xs text-slate-500">{patient.phone}{patient.age != null && ` · ${patient.age} yrs`}{patient.gender && ` · ${GENDER_LABEL[patient.gender]}`}</p>
        </div>
      </div>

      {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold">{error}</div>}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className={labelCls}>Complaint</label>
          <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={2} maxLength={2000} className={inputCls} placeholder="e.g. Fever and cough for 3 days" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {vital('bp', 'BP', '120/80')}
          {vital('pulse', 'Pulse', '78')}
          {vital('temperature', 'Temp', '98.6 °F')}
          {vital('weight', 'Weight (kg)', '65')}
          {vital('spo2', 'SpO₂ (%)', '98')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Findings</label>
            <textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={2} maxLength={4000} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Diagnosis</label>
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} maxLength={2000} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold text-[#10294c]">Prescription</h4>
          {lastWithMedicines && (
            <button type="button" onClick={() => setItems(lastWithMedicines.items!.map((i) => ({ ...i })))} className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5" /> Repeat last prescription ({formatDate(lastWithMedicines.visitDate)})
            </button>
          )}
        </div>
        <datalist id="rx-medicines">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
        <datalist id="rx-frequencies">{FREQUENCIES.map((f) => <option key={f} value={f} />)}</datalist>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-2 w-[28%]">Medicine</th><th className="pb-2 pr-2">Dose</th><th className="pb-2 pr-2">When</th>
                <th className="pb-2 pr-2">Food</th><th className="pb-2 pr-2 w-20">Days</th><th className="pb-2 pr-2">Notes</th><th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="align-top">
                  <td className="pb-2 pr-2"><input list="rx-medicines" value={it.medicine} onChange={(e) => setItem(idx, { medicine: e.target.value })} placeholder="Paracetamol 650 mg" maxLength={200} className={inputCls} /></td>
                  <td className="pb-2 pr-2"><input value={it.dose ?? ''} onChange={(e) => setItem(idx, { dose: e.target.value })} placeholder="1 tab" maxLength={100} className={inputCls} /></td>
                  <td className="pb-2 pr-2"><input list="rx-frequencies" value={it.frequency ?? ''} onChange={(e) => setItem(idx, { frequency: e.target.value })} placeholder="1-0-1" maxLength={50} className={inputCls} /></td>
                  <td className="pb-2 pr-2">
                    <select value={it.timing ?? ''} onChange={(e) => setItem(idx, { timing: e.target.value })} className={inputCls}>
                      <option value="">—</option>
                      {TIMINGS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="pb-2 pr-2"><input type="number" min={0} max={3650} value={it.durationDays ?? ''} onChange={(e) => setItem(idx, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) })} className={inputCls} /></td>
                  <td className="pb-2 pr-2"><input value={it.notes ?? ''} onChange={(e) => setItem(idx, { notes: e.target.value })} maxLength={500} className={inputCls} /></td>
                  <td className="pb-2">
                    <button type="button" onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [emptyItem()]))} className="p-2 text-slate-400 hover:text-rose-600" aria-label="Remove medicine"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])} disabled={items.length >= 50} className="px-3 py-1.5 text-xs font-bold rounded-xl border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add medicine
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Advice</label>
          <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} rows={2} maxLength={4000} className={inputCls} placeholder="Diet, tests, precautions" />
        </div>
        <div>
          <label className={labelCls}>Follow-up date</label>
          <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#195fbd] hover:bg-[#124a96] text-white flex items-center gap-2 disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save visit
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------

const esc = (s?: string | number) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Opens a printable A5-style prescription in a new window. */
const printPrescription = (patient: PatientRecord['patient'], v: Consultation) => {
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) {
    alert('Allow pop-ups for this site to print prescriptions.');
    return;
  }
  const vit = v.vitals ?? {};
  const vitals = [vit.bp && `BP ${vit.bp}`, vit.pulse && `Pulse ${vit.pulse}`, vit.temperature && `Temp ${vit.temperature}`,
    vit.weight && `Wt ${vit.weight} kg`, vit.spo2 && `SpO2 ${vit.spo2}%`].filter(Boolean).join(' &nbsp;·&nbsp; ');
  const rows = (v.items ?? []).map((i, n) => `<tr><td>${n + 1}</td><td><b>${esc(i.medicine)}</b></td><td>${esc(i.dose)}</td><td>${esc(i.frequency)}</td><td>${esc(i.timing)}</td><td>${esc(i.durationDays)}</td><td>${esc(i.notes)}</td></tr>`).join('');
  const block = (label: string, value?: string) => (value ? `<p><span class="l">${label}:</span> ${esc(value).replace(/\n/g, '<br>')}</p>` : '');
  const gender = patient.gender ? GENDER_LABEL[patient.gender] : '';
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Prescription ${esc(patient.code)}</title>
<style>
  body{font-family:Arial,sans-serif;color:#10294c;margin:32px;font-size:13px}
  header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #195fbd;padding-bottom:12px}
  header img{width:90px;height:auto}
  h1{font-size:20px;margin:0} .sub{color:#555;font-size:11px}
  .doc{text-align:right;margin-left:auto} .doc b{font-size:14px}
  .pt{display:flex;flex-wrap:wrap;gap:6px 24px;margin:14px 0;padding:10px;background:#f2f6fc;border-radius:6px}
  .l{font-weight:bold;color:#195fbd} p{margin:6px 0}
  table{width:100%;border-collapse:collapse;margin:10px 0} th,td{border:1px solid #cfd9e6;padding:6px;text-align:left;font-size:12px} th{background:#f2f6fc}
  .rx{font-size:22px;font-weight:bold;color:#195fbd;margin-top:14px}
  footer{margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;color:#555}
  .sign{text-align:center;border-top:1px solid #10294c;padding-top:4px;min-width:200px;color:#10294c}
  @media print{body{margin:14mm}}
</style></head><body>
<header><img src="${window.location.origin}/hospital_logo.png" alt=""><div><h1>We Care Multispeciality Hospital &amp; ICU</h1><div class="sub">Doddaballapura, Karnataka</div></div>
<div class="doc"><b>${esc(v.doctorName)}</b><br>${esc(v.doctorQualification)}<br>${esc(v.doctorDesignation)}${v.doctorRegistration ? `<br>Reg. No. ${esc(v.doctorRegistration)}` : ''}</div></header>
<div class="pt"><span><span class="l">Patient:</span> ${esc(patient.name)}</span><span><span class="l">ID:</span> ${esc(patient.code)}</span>
${patient.age != null ? `<span><span class="l">Age:</span> ${esc(patient.age)}</span>` : ''}${gender ? `<span><span class="l">Gender:</span> ${gender}</span>` : ''}
<span><span class="l">Phone:</span> ${esc(patient.phone)}</span><span><span class="l">Date:</span> ${esc(formatDate(v.visitDate))}</span></div>
${block('Complaint', v.complaint)}${vitals ? `<p><span class="l">Vitals:</span> ${vitals}</p>` : ''}${block('Findings', v.findings)}${block('Diagnosis', v.diagnosis)}
${rows ? `<div class="rx">&#8478;</div><table><thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>When</th><th>Food</th><th>Days</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
${block('Advice', v.advice)}${v.followUpDate ? `<p><span class="l">Follow-up:</span> ${esc(formatDate(v.followUpDate))}</p>` : ''}
<footer><span>Patient ID ${esc(patient.code)}</span><span class="sign">${esc(v.doctorName)}</span></footer>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  w.document.close();
};
