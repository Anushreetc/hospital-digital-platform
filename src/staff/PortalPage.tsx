import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ShieldCheck, Stethoscope, Headphones, Building2, HeartHandshake } from 'lucide-react';
import { StaffApp } from './StaffApp';
import { portalInfo, StaffPortal } from './portalAccess';
import './portals.css';
const icons = {doctor: Stethoscope, reception: Headphones, admin: Building2};
export default function PortalPage() {
 const {portal} = useParams();
 if (portal && ['doctor','reception','admin'].includes(portal)) return <StaffApp portal={portal as StaffPortal}/>;
 if (portal) return <div className="portal-home"><h1>Portal not found</h1><Link to="/staff">Choose a staff portal</Link></div>;
 return <div className="portal-home"><header><Link to="/" className="portal-brand"><img className="portal-official-logo" src="/images/wecare-official-logo.jpeg" alt="We Care Hospital logo"/><span>STAFF WORKSPACE</span></Link><Link to="/"><ArrowLeft size={16}/> Back to hospital website</Link></header><main><div className="portal-label"><ShieldCheck size={16}/> AUTHORISED HOSPITAL STAFF</div><h1>Your role. Your workspace.</h1><p>Choose your portal to sign in securely. Access is limited to your assigned hospital role.</p><div className="portal-options">{(Object.keys(portalInfo) as StaffPortal[]).map(key=>{const p=portalInfo[key], Icon=icons[key];return <Link to={`/staff/${key}`} className="portal-option" key={key}><span className="portal-option-icon"><Icon size={28}/></span><h2>{p.title}</h2><p>{p.description}</p><ul>{p.features.map(f=><li key={f}>{f}</li>)}</ul><span className="portal-option-action">Sign in to {key==='reception'?'reception':key==='doctor'?'doctor':'admin'} portal <ArrowUpRight size={18}/></span></Link>})}</div><div className="portal-security"><ShieldCheck size={20}/><span>Invitation-only accounts · Role-based access · Two-factor authentication</span></div></main><footer>We Care Multispeciality Hospital & ICU · Doddaballapura</footer></div>;
}
