import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { User, Stethoscope, Building2, ShieldAlert, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  role: 'PATIENT' | 'DOCTOR' | 'MANAGEMENT';
  onSuccessLogin: (token: string, user: any, role: string) => void;
  onBackToWebsite: () => void;
}

export const AuthPages: React.FC<Props> = ({ role, onSuccessLogin, onBackToWebsite }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  // Doctor fields
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-cardio');
  const [experienceYears, setExperienceYears] = useState(5);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [bio, setBio] = useState('');

  // Management fields
  const [hospitalName, setHospitalName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (role === 'PATIENT') {
        if (isSignup) {
          const res = await apiClient.patientSignup({ name, email, phone, password, dob });
          localStorage.setItem('hospital_auth_token', res.token);
          onSuccessLogin(res.token, res.patient, 'PATIENT');
        } else {
          const res = await apiClient.patientLogin({ email, password });
          localStorage.setItem('hospital_auth_token', res.token);
          onSuccessLogin(res.token, res.patient, 'PATIENT');
        }
      } else if (role === 'DOCTOR') {
        if (isSignup) {
          const res = await apiClient.doctorSignup({
            name, email, phone, password, qualification, specialization, designation,
            departmentId, experienceYears, registrationNumber, languages: ['Kannada', 'English'], bio
          });
          setSuccessMsg(res.message);
        } else {
          const res = await apiClient.doctorLogin({ email, password });
          localStorage.setItem('hospital_auth_token', res.token);
          onSuccessLogin(res.token, res.doctor, 'DOCTOR');
        }
      } else if (role === 'MANAGEMENT') {
        if (isSignup) {
          const res = await apiClient.managementSignup({ hospitalName, name, email, phone, password });
          setSuccessMsg(res.message);
        } else {
          const res = await apiClient.managementLogin({ email, password });
          localStorage.setItem('hospital_auth_token', res.token);
          onSuccessLogin(res.token, res.user, res.user.role);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 relative">
        <button
          onClick={onBackToWebsite}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Website
        </button>

        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            {role === 'PATIENT' && <User className="w-6 h-6 text-emerald-600" />}
            {role === 'DOCTOR' && <Stethoscope className="w-6 h-6 text-blue-600" />}
            {role === 'MANAGEMENT' && <Building2 className="w-6 h-6 text-indigo-600" />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {role === 'PATIENT' ? 'Patient Portal' : role === 'DOCTOR' ? 'Doctor Portal' : 'Hospital Management'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isSignup ? 'Create a new account' : 'Sign in to access your dashboard'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="text-sm font-bold text-emerald-900">{successMsg}</div>
            <button
              onClick={() => setIsSignup(false)}
              className="bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Conditional Signup Warning Notices */}
            {isSignup && role === 'DOCTOR' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Doctor registrations require Hospital Management review before becoming active.</span>
              </div>
            )}

            {isSignup && role === 'MANAGEMENT' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Management accounts enter PENDING status and require Super Admin approval.</span>
              </div>
            )}

            {isSignup && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {isSignup && role === 'MANAGEMENT' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Care Super Specialty Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {isSignup && (role === 'PATIENT' || role === 'DOCTOR') && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Doctor Specific Signup Fields */}
            {isSignup && role === 'DOCTOR' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qualification</label>
                  <input type="text" placeholder="MBBS, MD, DM" value={qualification} onChange={e => setQualification(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specialization</label>
                  <input type="text" placeholder="Interventional Cardiology" value={specialization} onChange={e => setSpecialization(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input type="text" placeholder="Senior Consultant" value={designation} onChange={e => setDesignation(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medical Reg No.</label>
                  <input type="text" placeholder="KMC-12345" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignup ? 'Submit Account Registration' : 'Sign In to Dashboard'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {isSignup ? 'Already have an account? Sign In' : 'Need an account? Register Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
