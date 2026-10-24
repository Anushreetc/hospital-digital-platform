import React,{useState,useRef,useEffect} from 'react';
import {Mic,MicOff,MessageCircle,X,Send,Volume2,VolumeX,RotateCcw} from 'lucide-react';
import {Department,Doctor,HospitalInfo} from '../types';
import {publicApi} from '../services/db';
import {supabase,isSupabaseConfigured,errorMessage} from '../lib/supabase';
import {BookingDraft,Step,emptyDraft,hospitalToday,plusDays,normalizePhone,parseDate,validDate,nextStep,promptFor} from '../assistant/booking';
import {elevenLabsVoice, PRECONFIGURED_ELEVENLABS_VOICES} from '../services/elevenLabsVoice';
const newKey=()=>Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b=>b.toString(16).padStart(2,'0')).join('');
type Message={role:'user'|'assistant';text:string};
export const HospitalAssistant:React.FC<{departments:Department[];doctors:Doctor[];hospitalInfo:HospitalInfo}>=({departments,doctors,hospitalInfo})=>{
 const [open,setOpen]=useState(false),[kn,setKn]=useState(false),[draft,setDraft]=useState(emptyDraft),[step,setStep]=useState<Step>('welcome');
 const [messages,setMessages]=useState<Message[]>([{role:'assistant',text:promptFor('welcome',false)}]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [slots,setSlots]=useState<Array<{time:string;label:string;available:number}>>([]),[listening,setListening]=useState(false),[voice,setVoice]=useState(false),[consent,setConsent]=useState(false),[askConsent,setAskConsent]=useState(false),[audioEnabled,setAudioEnabled]=useState(true),[selectedDate,setSelectedDate]=useState(hospitalToday());
 const [elevenVoiceId,setElevenVoiceId]=useState<string>(elevenLabsVoice.getSelectedVoiceId());
 const voiceUsed=useRef(false), micAttempt=useRef(0);
 const [startingMic,setStartingMic]=useState(false);
 const key=useRef(newKey()),recognition=useRef<any>(null),voiceOn=useRef(false),end=useRef<HTMLDivElement>(null),sendRef=useRef<(text:string)=>void>(()=>{}),listenRef=useRef<()=>void>(()=>{}),busyRef=useRef(false),mounted=useRef(true),generation=useRef(0);
 const aiEnabled=isSupabaseConfigured&&(import.meta as any).env.VITE_ENABLE_AI_ASSISTANT==='true';
 const audio=useRef<HTMLAudioElement|null>(null),speechVersion=useRef(0);
 const resumeListening=()=>{window.setTimeout(()=>{if(mounted.current&&voiceOn.current&&!busyRef.current)listenRef.current()},150)};
 const say=(text:string)=>{
  setMessages(m=>[...m,{role:'assistant',text}]);
  if(!voiceOn.current)return;
  if(!audioEnabled){resumeListening();return;}
  const version=++speechVersion.current;
  elevenLabsVoice.stop();
  window.speechSynthesis?.cancel();
  setStatus(kn?'🔊 ElevenLabs ಧ್ವನಿ ಮಾತನಾಡುತ್ತಿದೆ...':'🔊 ElevenLabs voice speaking...');
  elevenLabsVoice.speak(text,{
   voiceId:elevenVoiceId,
   isKannada:kn,
   onStart:()=>{if(version===speechVersion.current)setStatus(kn?'🔊 ElevenLabs ಧ್ವನಿ ಮಾತನಾಡುತ್ತಿದೆ...':'🔊 ElevenLabs voice speaking...')},
   onEnd:()=>{if(version===speechVersion.current){setStatus('');resumeListening()}},
   onError:()=>{if(version===speechVersion.current){setStatus('');resumeListening()}}
  });
 };
 const stopVoice=()=>{micAttempt.current++;setStartingMic(false);speechVersion.current++;elevenLabsVoice.stop();audio.current?.pause();voiceOn.current=false;setVoice(false);recognition.current?.abort();window.speechSynthesis?.cancel();setListening(false)};
 const close=()=>{stopVoice();setOpen(false);setAskConsent(false)};
 useEffect(()=>{mounted.current=true;const openAssistant=()=>setOpen(true);window.addEventListener('open-hospital-assistant',openAssistant);return()=>{mounted.current=false;micAttempt.current++;generation.current++;speechVersion.current++;audio.current?.pause();voiceOn.current=false;recognition.current?.abort();window.speechSynthesis?.cancel();window.removeEventListener('open-hospital-assistant',openAssistant)}},[]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth',block:'nearest'})},[messages,busy]);
 useEffect(()=>{if(!open)return;const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')close()};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[open]);
 const reset=(language=kn)=>{generation.current++;voiceUsed.current=false;stopVoice();setKn(language);setDraft(emptyDraft());setStep('welcome');setSlots([]);setMessages([{role:'assistant',text:promptFor('welcome',language)}]);setInput('');setStatus('');key.current=newKey();};
 const advance=async(d:BookingDraft)=>{
  setDraft(d);const next=nextStep(d);setStep(next);
  if(next==='slotTime'){
   if(!isSupabaseConfigured){say(kn?'ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್ ಇನ್ನೂ ಸಕ್ರಿಯವಾಗಿಲ್ಲ. ಸಮಯ ಖಚಿತಪಡಿಸಲು ರಿಸೆಪ್ಷನ್‌ಗೆ +91 88677 55541 ಕರೆ ಮಾಡಿ. ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಆಗಿಲ್ಲ.':'Online booking is not activated yet. Please call reception on +91 88677 55541 to confirm availability. No appointment has been booked.');return;}
   const list=await publicApi.getAvailableSlots(d.doctorId,d.date);setSlots(list.filter(s=>s.available>0));
   if(!list.some(s=>s.available>0)){setDraft({...d,date:'',slotTime:''});setStep('date');say(kn?'ಈ ದಿನ ಖಾಲಿ ಸಮಯ ಇಲ್ಲ. ಬೇರೆ ದಿನ ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ರಿಸೆಪ್ಷನ್‌ಗೆ ಕರೆ ಮಾಡಿ.':'No slots are available on that date. Choose another day or call reception.');return;}
   say(promptFor(next,kn)+'\n'+list.filter(s=>s.available>0).map((s,i)=>`${i+1}. ${s.label}`).join(' · '));return;
  }
  say(promptFor(next,kn));
 };
 const choose=async(field:keyof BookingDraft,value:string)=>{if(busyRef.current)return;busyRef.current=true;setBusy(true);try{let d={...draft,[field]:value};if(field==='doctorId')d={...d,date:'',slotTime:''};if(field==='date')d.slotTime='';await advance(d)}catch(e){say(errorMessage(e))}finally{busyRef.current=false;setBusy(false)}};
 const confirm=async()=>{
  if(busyRef.current||step!=='review')return;
  if(!isSupabaseConfigured){say(kn?'ಬುಕಿಂಗ್ ಸಕ್ರಿಯವಾಗಿಲ್ಲ. ರಿಸೆಪ್ಷನ್‌ಗೆ ಕರೆ ಮಾಡಿ.':'Booking is awaiting activation. Please call reception.');return;}
  busyRef.current=true;setBusy(true);const version=generation.current;
  try{
   const available=await publicApi.getAvailableSlots(draft.doctorId,draft.date);
   if(!available.some(s=>s.time===draft.slotTime&&s.available>0)){setDraft({...draft,slotTime:''});setSlots(available.filter(s=>s.available>0));setStep('slotTime');say(kn?'ಈ ಸಮಯ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ಬೇರೆ ಸಮಯ ಆಯ್ಕೆ ಮಾಡಿ.':'That slot is no longer available. Please choose another time.');return;}
   const booked=await publicApi.bookAppointment({...draft,source:voiceUsed.current?'VOICE_AI':'WEBSITE',language:kn?'KN':'EN',idempotencyKey:key.current});
   if(version!==generation.current)return;stopVoice();setStep('done');say(kn?`ನಿಮ್ಮ ವಿನಂತಿ ರಿಸೆಪ್ಷನ್‌ಗೆ ತಲುಪಿದೆ. ಬುಕ್ಕಿಂಗ್ ಸಂಖ್ಯೆ: ${booked.code}. ಟೋಕನ್: ${booked.tokenNumber}. ಸ್ಥಿತಿ: ${booked.status==='CONFIRMED'?'ದೃಢೀಕರಿಸಲಾಗಿದೆ':'ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ'}.`:`Your request has reached reception. Booking reference: ${booked.code}. Token: ${booked.tokenNumber}. Status: ${booked.status==='CONFIRMED'?'Confirmed':'Awaiting reception confirmation'}.`);
  }catch(e){say(errorMessage(e,kn?'ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ಪುನಃ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ರಿಸೆಪ್ಷನ್‌ಗೆ ಕರೆ ಮಾಡಿ.':'Could not send the request. Retry or call reception.'))}finally{busyRef.current=false;setBusy(false)}
 };
 const send=async(raw:string)=>{
  const text=raw.trim();if(!text||busyRef.current)return;setInput('');setMessages(m=>[...m,{role:'user',text}]);setStatus('');
  if(/\b(cancel|restart|start over)\b|ರದ್ದು|ಮತ್ತೆ ಪ್ರಾರಂಭ/i.test(text)){reset();return;}
  if(step==='review'&&/^(yes|confirm|book|send|ಹೌದು|ಸರಿ|ದೃಢೀಕರಿಸಿ)[.!\s]*$/i.test(text)){await confirm();return;}
  if(/\b(emergency|ambulance)\b|ತುರ್ತು|ಆಂಬುಲೆನ್ಸ್/i.test(text)){say(kn?'ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ಈಗಲೇ +91 88677 55541 ಕರೆ ಮಾಡಿ. ಆಂಬುಲೆನ್ಸ್: +91 93530 61993. ಚಾಟ್‌ನಲ್ಲಿ ಕಾಯಬೇಡಿ.':`For urgent help, call ${hospitalInfo.emergencyPhone} now. Ambulance: ${hospitalInfo.ambulancePhone}. Do not wait for a chat reply.`);stopVoice();return;}
  if(/\b(address|location|where|directions)\b|ವಿಳಾಸ|ಎಲ್ಲಿದೆ/i.test(text)){say(kn?'ನಮ್ಮ ವಿಳಾಸ: ಡಿ ಕ್ರಾಸ್ ಮುಖ್ಯ ರಸ್ತೆ, ಫೆಡರಲ್ ಬ್ಯಾಂಕ್ ಹತ್ತಿರ, ದೊಡ್ಡಬಳ್ಳಾಪುರ, ಕರ್ನಾಟಕ 561203.':hospitalInfo.address);return;}
  if(/visiting|visit hours|ಭೇಟಿ ಸಮಯ/i.test(text)){say(kn?'ಸಾಮಾನ್ಯ ಭೇಟಿ: ಬೆಳಗ್ಗೆ 9 ರಿಂದ 11; ಸಂಜೆ 6 ರಿಂದ 7. ICU: ಸಂಜೆ 5 ರಿಂದ 6. ಬರುವ ಮೊದಲು ರಿಸೆಪ್ಷನ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿ.':`General visiting: ${hospitalInfo.visitingHours?.general}. ICU: ${hospitalInfo.visitingHours?.icu}. Please confirm with reception before visiting.`);return;}
  if(/insurance|cashless|ವಿಮೆ/i.test(text)){say(kn?'ನಿಮ್ಮ ವಿಮೆ ಮತ್ತು ಕ್ಯಾಶ್‌ಲೆಸ್ ಸೌಲಭ್ಯಗಳ ಬಗ್ಗೆ ರಿಸೆಪ್ಷನ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿ. ವಿಮೆ ವಿವರಗಳು ಮತ್ತು ಗುರುತಿನ ಚೀಟಿ ತನ್ನಿ.':'Reception can confirm insurance and cashless eligibility for your policy. Bring your policy details, photo ID and medical reports.');return;}
  if(/tariff|room price|room cost|ಕೊಠಡಿ|ದರ/i.test(text)){say(kn?'ಸಾಮಾನ್ಯ ವಾರ್ಡ್, ಸೆಮಿ ಪ್ರೈವೇಟ್, ಪ್ರೈವೇಟ್ ಕೊಠಡಿಗಳು ಮತ್ತು ICU ಲಭ್ಯವಿವೆ. ಕೊಠಡಿ ಲಭ್ಯತೆ ಮತ್ತು ದಾಖಲಾತಿ ಮಾಹಿತಿಗಾಗಿ ರಿಸೆಪ್ಷನ್ ಸಂಪರ್ಕಿಸಿ.':'General ward, semi-private and private rooms, and ICU care are available. Please contact reception for room availability and admission details.');return;}
  if(step==='welcome'){await advance(emptyDraft());return;}
  if(step==='done'){say(kn?'ಹೊಸ ವಿನಂತಿಗಾಗಿ ಮೇಲಿನ ಮರುಪ್ರಾರಂಭ ಬಟನ್ ಒತ್ತಿ.':'Use restart above to begin another request.');return;}
  busyRef.current=true;setBusy(true);const version=generation.current;
  try{
   let d={...draft};let extracted=false;
   if(aiEnabled&&consent){
    try{const {data,error}=await supabase.functions.invoke('appointment-assistant',{body:{message:text,draft,step,language:kn?'KN':'EN',today:hospitalToday()}});if(error)throw error;if(version!==generation.current)return;
     const f=data?.fields??{};
     if(typeof f.patientName==='string'&&f.patientName.trim().length>=2&&f.patientName.length<=120){d.patientName=f.patientName.trim();extracted=true;}
     if(typeof f.patientPhone==='string'&&/^[6-9]\d{9}$/.test(normalizePhone(f.patientPhone))){d.patientPhone=normalizePhone(f.patientPhone);extracted=true;}
     if(typeof f.doctorId==='string'&&doctors.some(doc=>doc.active&&doc.id===f.doctorId)){if(d.doctorId!==f.doctorId){d.date='';d.slotTime='';}d.doctorId=f.doctorId;extracted=true;}
     if(typeof f.date==='string'&&validDate(f.date)){if(d.date!==f.date)d.slotTime='';d.date=f.date;extracted=true;}
     if(typeof f.slotTime==='string'&&d.doctorId===draft.doctorId&&d.date===draft.date&&slots.some(s=>s.time===f.slotTime&&s.available>0)){d.slotTime=f.slotTime;extracted=true;}
     if(typeof f.reason==='string'&&f.reason.length>=2&&f.reason.length<=500){d.reason=f.reason;extracted=true;}
    }catch{setStatus(kn?'ಸಹಜ ಸಂಭಾಷಣೆ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. ಹಂತ ಹಂತವಾಗಿ ಮುಂದುವರಿಯೋಣ.':'Natural-language service is unavailable. We can continue step by step.');}
   }
   if(!extracted){
    if(step==='patientName'){const name=text.replace(/^(my name is|i am|i'm|ನನ್ನ ಹೆಸರು)\s*/i,'').trim();if(name.length<2||name.length>120){say(promptFor('patientName',kn));return;}d.patientName=name;}
    else if(step==='patientPhone'){const phone=normalizePhone(text);if(!/^[6-9]\d{9}$/.test(phone)){say(kn?'ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಹೇಳಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.':'Please say or type a valid 10-digit Indian mobile number.');return;}d.patientPhone=phone;}
    else if(step==='doctorId'){const doc=doctors.find(doc=>doc.active&&(doc.name.toLowerCase().includes(text.toLowerCase())||text.toLowerCase().includes(doc.name.replace(/^dr\.?\s*/i,'').toLowerCase())));if(!doc){say(promptFor('doctorId',kn));return;}d.doctorId=doc.id;}
    else if(step==='date'){const date=parseDate(text);if(!validDate(date)){say(kn?'ಮುಂದಿನ 60 ದಿನಗಳೊಳಗಿನ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.':'Please choose a date within the next 60 days using the date picker.');return;}d.date=date;}
    else if(step==='slotTime'){const index=Number(normalizePhone(text))-1;const slot=slots.find(s=>text.includes(s.label)||text===s.time)||slots[index];if(!slot){say(promptFor('slotTime',kn));return;}d.slotTime=slot.time;}
    else if(step==='reason'){if(text.length<2||text.length>500){say(kn?'ಭೇಟಿಯ ಕಾರಣವನ್ನು 500 ಅಕ್ಷರಗಳೊಳಗೆ ತಿಳಿಸಿ.':'Please describe the reason in 2–500 characters.');return;}d.reason=text;}
    else if(step==='review'){say(kn?'ವಿವರ ಬದಲಾಯಿಸಲು ಸಂಪಾದಿಸಿ ಒತ್ತಿ. ಕಳುಹಿಸಲು ದೃಢೀಕರಿಸಿ ಒತ್ತಿ.':'Choose Edit details to make changes, or Confirm request to send.');return;}
   }
   await advance(d);
  }catch(e){say(errorMessage(e))}finally{busyRef.current=false;setBusy(false)}
 };
 sendRef.current=send;
 const micError=(code:string)=>{
  const messages:Record<string,[string,string]>={
   'not-allowed':['Microphone access is blocked. Open this website directly in a browser tab, allow Microphone in the site settings, and check your device microphone permission. Then try again.','ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ತೆರೆಯಿರಿ. ಸೈಟ್ ಮತ್ತು ಸಾಧನದ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಸಿ, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'],
   'audio-capture':['No usable microphone was found. Connect or enable your microphone, close other apps using it, and try again.','ಮೈಕ್ರೊಫೋನ್ ಲಭ್ಯವಿಲ್ಲ. ಅದನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಸಕ್ರಿಯಗೊಳಿಸಿ. ಅದನ್ನು ಬಳಸುವ ಇತರ ಆ್ಯಪ್‌ಗಳನ್ನು ಮುಚ್ಚಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'],
   'network':['The browser speech service could not connect. Check your internet connection, then retry or type your message.','ಧ್ವನಿ ಸೇವೆಗೆ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಇಂಟರ್‌ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
   'no-speech':['No speech was detected. Tap the microphone and speak when “Listening” appears.','ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮೈಕ್ ಒತ್ತಿ, “ಕೇಳುತ್ತಿದ್ದೇನೆ” ಕಾಣಿಸಿದಾಗ ಮಾತನಾಡಿ.'],
   'language-not-supported':['This browser does not support speech recognition in the selected language. Try another supported browser or type in Kannada or English.','ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಯ ಧ್ವನಿ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ಬೇರೆ ಬ್ರೌಸರ್ ಬಳಸಿ ಅಥವಾ ಕನ್ನಡ/ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ.'],
   'service-not-allowed':['The browser speech service is unavailable or disabled. Open the site directly in Chrome or Safari, or continue by typing.','ಬ್ರೌಸರ್ ಧ್ವನಿ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. ಸೈಟ್ ಅನ್ನು Chrome ಅಥವಾ Safari ನಲ್ಲಿ ನೇರವಾಗಿ ತೆರೆಯಿರಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
  };
  stopVoice();setStatus((messages[code]||['Could not start voice input. Check microphone permissions and try again. You can also type.','ಧ್ವನಿ ಪ್ರಾರಂಭಿಸಲಾಗಲಿಲ್ಲ. ಮೈಕ್ ಅನುಮತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'])[kn?1:0]);
 };
 const listen=async()=>{
  if(!mounted.current||busyRef.current)return;
  const attempt=++micAttempt.current;
  recognition.current?.abort();recognition.current=null;
  speechVersion.current++;audio.current?.pause();window.speechSynthesis?.cancel();
  const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!window.isSecureContext){stopVoice();setStatus(kn?'ಮೈಕ್ ಬಳಸಲು ಸುರಕ್ಷಿತ HTTPS ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ನೇರವಾಗಿ ತೆರೆಯಿರಿ.':'Microphone access requires HTTPS. Open the secure website directly in your browser.');return;}
  if(!Recognition){stopVoice();setStatus(kn?'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲವಿಲ್ಲ. Chrome ಅಥವಾ Safari ಬಳಸಿ, ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.':'This browser does not support voice input. Try Chrome or Safari, or continue by typing.');return;}
  const policy=(document as any).permissionsPolicy||(document as any).featurePolicy;
  if(policy?.allowsFeature&&!policy.allowsFeature('microphone')){micError('not-allowed');return;}
  setStartingMic(true);setStatus(kn?'ಮೈಕ್ರೊಫೋನ್ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ… ಅನುಮತಿ ಕೇಳಿದರೆ ಅನುಮತಿಸಿ.':'Starting microphone… Allow access if your browser asks.');
  try{
   if(navigator.mediaDevices?.getUserMedia){const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(track=>track.stop());}
   if(!mounted.current||attempt!==micAttempt.current||!voiceOn.current)return;
   const rec=new Recognition();recognition.current=rec;rec.lang=kn?'kn-IN':'en-IN';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=1;
   let received=false,failed=false;
   const current=()=>mounted.current&&attempt===micAttempt.current;
   rec.onstart=()=>{if(!current())return;setStartingMic(false);setListening(true);setStatus(kn?'ಕೇಳುತ್ತಿದ್ದೇನೆ… ಈಗ ಮಾತನಾಡಿ.':'Listening… Speak now.');};
   rec.onend=()=>{if(!current())return;setStartingMic(false);setListening(false);recognition.current=null;if(!received&&!failed){voiceOn.current=false;setVoice(false);setStatus(kn?'ಧ್ವನಿ ನಿಂತಿದೆ. ಮತ್ತೆ ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ.':'Listening stopped. Tap the microphone to speak again.');}};
   rec.onerror=(e:any)=>{if(!current()||e.error==='aborted')return;failed=true;micError(e.error);};
   rec.onresult=(e:any)=>{if(!current())return;const result=e.results?.[e.resultIndex];const text=result?.[0]?.transcript;if(!text)return;setStatus((kn?'ಕೇಳಿಸಿದ್ದು: ':'Heard: ')+text);if(result.isFinal&&!received){received=true;rec.stop();setListening(false);sendRef.current(text);}};
   rec.start();
  }catch(e:any){if(attempt!==micAttempt.current||!mounted.current)return;micError(e?.name==='NotAllowedError'?'not-allowed':['NotFoundError','NotReadableError','OverconstrainedError'].includes(e?.name)?'audio-capture':'unknown');}
 };listenRef.current=()=>{void listen()};
 const startVoice=()=>{
  setAskConsent(false);setConsent(true);voiceUsed.current=true;
  if(step==='welcome'){setStep('patientName');setMessages(m=>[...m,{role:'assistant',text:promptFor('patientName',kn)}]);}
  voiceOn.current=true;setVoice(true);void listen();
 };
 const doctor=doctors.find(d=>d.id===draft.doctorId);
 return <>{!open&&<button className="assistant-launch" onClick={()=>setOpen(true)}><MessageCircle size={21}/><span>Care assistant<small>ಕನ್ನಡ · English · Voice</small></span></button>}{open&&<aside role="dialog" aria-label="Hospital care assistant" className="care-assistant" lang={kn?'kn':'en'}><div className="assistant-head"><MessageCircle size={25}/><div><strong>{kn?'ನಿಮ್ಮ ಆರೈಕೆ ಸಹಾಯಕ':'Your care assistant'}</strong><small>We Care Hospital · ElevenLabs Voice</small></div><button aria-label="Close assistant" onClick={close}><X size={20}/></button></div><div className="assistant-settings"><select aria-label="Assistant language" value={kn?'KN':'EN'} onChange={e=>reset(e.target.value==='KN')} disabled={busy}><option value="EN">English</option><option value="KN">ಕನ್ನಡ</option></select><select aria-label="ElevenLabs voice" title="ElevenLabs Voice" value={elevenVoiceId} onChange={e=>{setElevenVoiceId(e.target.value);elevenLabsVoice.setSelectedVoiceId(e.target.value)}} disabled={busy}>{PRECONFIGURED_ELEVENLABS_VOICES.map(v=><option key={v.id} value={v.id}>{v.name.split(' ')[0]}</option>)}</select><button aria-label="Restart conversation" onClick={()=>reset()} disabled={busy}><RotateCcw size={15}/></button><button aria-label={audioEnabled?'Mute spoken replies':'Enable spoken replies'} onClick={()=>{setAudioEnabled(!audioEnabled);speechVersion.current++;audio.current?.pause();elevenLabsVoice.stop();window.speechSynthesis?.cancel()}}>{audioEnabled?<Volume2 size={16}/>:<VolumeX size={16}/>}</button><button onClick={()=>voice?stopVoice():setAskConsent(true)}>{voice?(kn?'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ':'Stop voice'):(kn?'ಮಾತನಾಡಿ':'Start voice')}</button><button type="button" aria-label="Open voice phone call" title="Launch ElevenLabs Voice Call" onClick={()=>{close();window.dispatchEvent(new Event('open-voice-call'))}}>📞 {kn?'ಕರೆ':'Call'}</button></div><div className="assistant-messages" role="log" aria-live="polite">{messages.map((m,i)=><div key={i} className={`assistant-message ${m.role}`}>{m.text}</div>)}{busy&&<div className="assistant-message">{kn?'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ…':'One moment…'}</div>}<div ref={end}/></div>
 {askConsent&&<div className="assistant-consent">{kn?'ಇದು ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ. ಬ್ರೌಸರ್ ಧ್ವನಿಯನ್ನು ಸಂಸ್ಕರಿಸಬಹುದು. AI ಅಥವಾ ಕ್ಲೌಡ್ ಧ್ವನಿ ಸಕ್ರಿಯವಿದ್ದರೆ ಪಠ್ಯ OpenAI ಅಥವಾ Microsoft Azure ಸೇವೆಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಅನುಮತಿ ಇಲ್ಲದೆ ಬುಕಿಂಗ್ ಮಾಡುವುದಿಲ್ಲ.':'This is an automated voice, not a person. Your browser’s speech service may process audio. With AI or cloud speech enabled, text is sent to OpenAI for understanding or Microsoft Azure for spoken replies. Nothing is booked without your confirmation.'}<div><button className="hospital-button" onClick={startVoice}>{kn?'ಒಪ್ಪುತ್ತೇನೆ, ಮಾತನಾಡೋಣ':'Agree & start talking'}</button><button onClick={()=>setAskConsent(false)}>{kn?'ಈಗ ಬೇಡ':'Not now'}</button></div></div>}
 {step==='welcome'&&<div className="assistant-options"><button onClick={()=>advance(emptyDraft())}>{kn?'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ':'Book an appointment'}</button><button onClick={()=>send(kn?'ವಿಳಾಸ':'Hospital location')}>{kn?'ಆಸ್ಪತ್ರೆಯ ವಿಳಾಸ':'Hospital location'}</button><button onClick={()=>send(kn?'ಭೇಟಿ ಸಮಯ':'Visiting hours')}>{kn?'ಭೇಟಿ ಸಮಯ':'Visiting hours'}</button>{aiEnabled&&!consent&&<button onClick={()=>{setConsent(true);say(kn?'ಸಹಜ ಸಂಭಾಷಣೆ ಸಕ್ರಿಯವಾಗಿದೆ. ನಿಮ್ಮ ಪಠ್ಯ AI ಸೇವೆಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.':'Natural conversation enabled. Your messages will be processed by the AI service.')}}>{kn?'AI ಸಂಭಾಷಣೆಗೆ ಒಪ್ಪುತ್ತೇನೆ':'Enable AI conversation (shares text)'}</button>}</div>}
 {step==='doctorId'&&<div className="assistant-options">{doctors.filter(d=>d.active).map(d=><button disabled={busy} onClick={()=>choose('doctorId',d.id)} key={d.id}>{d.name} · {d.specialization}</button>)}</div>}
 {step==='date'&&<div className="assistant-options"><input aria-label="Preferred appointment date" type="date" value={selectedDate} min={hospitalToday()} max={plusDays(hospitalToday(),60)} onChange={e=>setSelectedDate(e.target.value)}/><button disabled={busy||!validDate(selectedDate)} onClick={()=>choose('date',selectedDate)}>{kn?'ಈ ದಿನ ಆಯ್ಕೆ ಮಾಡಿ':'Choose date'}</button></div>}
 {step==='slotTime'&&<div className="assistant-options">{slots.map(s=><button disabled={busy} key={s.time} onClick={()=>choose('slotTime',s.time)}>{s.label}</button>)}<button disabled={busy} onClick={()=>{setStep('date');setDraft({...draft,date:'',slotTime:''});setSlots([]);say(promptFor('date',kn))}}>{kn?'ಬೇರೆ ದಿನ':'Change date'}</button></div>}
 {step==='review'&&<div className="assistant-review"><strong>{kn?'ಬುಕಿಂಗ್ ವಿವರಗಳು':'Appointment details'}</strong><br/>{draft.patientName} · {draft.patientPhone}<br/>{doctor?.name} · {doctor?.specialization}<br/>{draft.date} · {slots.find(s=>s.time===draft.slotTime)?.label||draft.slotTime}<br/>{draft.reason}<br/><button className="hospital-button" disabled={busy} onClick={confirm}>{kn?'ದೃಢೀಕರಿಸಿ, ರಿಸೆಪ್ಷನ್‌ಗೆ ಕಳುಹಿಸಿ':'Confirm request to reception'}</button> <button disabled={busy} onClick={()=>{setStep('patientName');setDraft(emptyDraft());setSlots([]);say(promptFor('patientName',kn))}}>{kn?'ಸಂಪಾದಿಸಿ':'Edit details'}</button></div>}
 {status&&<div className="assistant-status" role="status">{status}</div>}<form className="assistant-composer" onSubmit={e=>{e.preventDefault();send(input)}}><input maxLength={500} aria-label={kn?'ನಿಮ್ಮ ಸಂದೇಶ':'Your message'} placeholder={listening?(kn?'ಕೇಳುತ್ತಿದ್ದೇನೆ…':'Listening…'):(kn?'ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ…':'Type your message…')} value={input} onChange={e=>setInput(e.target.value)} disabled={busy}/><button type="button" aria-label={listening||startingMic?'Stop microphone':'Speak your message'} aria-pressed={listening||startingMic} disabled={busy} onClick={()=>{if(listening||startingMic){stopVoice();setStatus('')}else if(!consent){setAskConsent(true)}else{voiceUsed.current=true;voiceOn.current=true;setVoice(true);listen()}}}>{listening||startingMic?<MicOff size={18}/>:<Mic size={18}/>}</button><button aria-label="Send message" disabled={busy||!input.trim()}><Send size={18}/></button></form><div className="assistant-privacy">{kn?'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಸಹಾಯ ಮಾತ್ರ; ವೈದ್ಯಕೀಯ ಸಲಹೆ ಅಲ್ಲ. ತುರ್ತು ಸಂದರ್ಭ: +91 88677 55541.':'Appointment assistance, not medical advice. Urgent help: +91 88677 55541.'} {!isSupabaseConfigured&&(kn?' ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್ ಸಕ್ರಿಯವಾಗಿಲ್ಲ.':' Online booking awaits activation.')}</div></aside>}</>;
};
