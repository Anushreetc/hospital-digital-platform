import React from 'react';
import { HospitalInfo } from '../types';
import { Phone, MapPin, Mail, Clock, MessageSquare, ExternalLink } from 'lucide-react';

interface Props {
  hospitalInfo: HospitalInfo;
}

export const ContactSection: React.FC<Props> = ({ hospitalInfo }) => {
  return (
    <section id="contact" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Location & Contact
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Reach Out to Our Medical Helpdesk
          </h2>
          <p className="text-base text-slate-600">
            Available 24 hours a day for emergency admissions, OPD appointments, and ambulance dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Emergency & Reception Phone</h4>
                  <a href={`tel:${hospitalInfo.emergencyPhone}`} className="text-sm font-semibold text-rose-600 hover:underline block">
                    🚨 {hospitalInfo.emergencyPhone} (24/7 Helpline)
                  </a>
                  <a href={`tel:${hospitalInfo.phone}`} className="text-xs text-slate-600 hover:underline block">
                    📞 {hospitalInfo.phone} (OPD Enquiries)
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200/60 pt-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Official WhatsApp Helpdesk</h4>
                  <a
                    href={`https://wa.me/${hospitalInfo.whatsAppNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Connect on WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200/60 pt-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Email Address</h4>
                  <a href={`mailto:${hospitalInfo.email}`} className="text-xs text-slate-600 hover:underline">
                    {hospitalInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200/60 pt-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">OPD & Visiting Hours</h4>
                  <p className="text-xs text-slate-600">{hospitalInfo.operatingHours}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                Hospital Address
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">{hospitalInfo.address}</p>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white pt-2"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Map Embed */}
          <div className="lg:col-span-7 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 min-h-[350px] shadow-sm relative">
            <iframe
              title="Hospital Location Map"
              src={hospitalInfo.mapEmbedUrl}
              className="w-full h-full min-h-[400px] border-0"
              allowFullScreen={false}
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};
