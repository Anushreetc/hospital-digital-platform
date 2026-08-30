import { FileRepository } from '../repositories/FileRepository';
import { AppointmentService } from './AppointmentService';
import { VoiceCall, VoiceCallOutcome } from '../models/types';

export interface VapiToolCallPayload {
  message: {
    type: string; // 'tool-calls' or 'function-call'
    toolCalls?: Array<{
      id: string;
      function: {
        name: string;
        arguments: any;
      };
    }>;
    functionCall?: {
      name: string;
      parameters: any;
    };
    call?: {
      id: string;
      customer?: {
        number?: string;
      };
    };
  };
}

export class TelephonyService {
  private fileRepo: FileRepository;
  private appointmentService: AppointmentService;

  constructor(fileRepo: FileRepository, appointmentService: AppointmentService) {
    this.fileRepo = fileRepo;
    this.appointmentService = appointmentService;
  }

  /**
   * Generate Twilio TwiML Response for Incoming Calls
   */
  public generateTwilioTwiML(callId?: string, callerNumber?: string): string {
    const hospital = this.fileRepo.getHospitalInfo();

    // Track Call Session Start
    if (callId) {
      this.fileRepo.saveVoiceCall({
        id: `vcall_${Date.now()}`,
        callId: callId,
        phoneNumber: callerNumber ? this.appointmentService.normalizePhone(callerNumber) : 'UNKNOWN',
        startedAt: new Date().toISOString(),
        language: 'KANGLISH',
        status: 'IN_PROGRESS',
        outcome: 'INFORMATION_PROVIDED',
        createdAt: new Date().toISOString()
      });
    }

    // TwiML response routing to Vapi / Voice Assistant Stream
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Google.kn-IN" language="kn-IN">
        ನಮಸ್ಕಾರ! ${hospital.name} ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ.
    </Say>
    <Say voice="Polly.Aditi" language="en-IN">
        Welcome to ${hospital.name}. Connecting you to our AI Phone Receptionist.
    </Say>
    <Connect>
        <Stream url="wss://${process.env.VAPI_SIP_DOMAIN || 'vapi.ai/stream'}" />
    </Connect>
</Response>`;
  }

  /**
   * Execute Vapi Function / Tool Call Request
   */
  public async handleVapiToolCall(payload: VapiToolCallPayload): Promise<any> {
    const toolCalls = payload.message?.toolCalls || [];
    const singleFunc = payload.message?.functionCall;
    const callId = payload.message?.call?.id || `vapi_call_${Date.now()}`;
    const callerNumber = payload.message?.call?.customer?.number;

    const results: Array<{ toolCallId?: string; result: any }> = [];

    // Process array of tool calls
    if (toolCalls.length > 0) {
      for (const tc of toolCalls) {
        const name = tc.function.name;
        const rawArgs = tc.function.arguments;
        const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : (rawArgs || {});
        const res = await this.dispatchTool(name, args, callId, callerNumber);
        results.push({ toolCallId: tc.id, result: res });
      }
      return { results };
    }

    // Process single function call
    if (singleFunc) {
      const name = singleFunc.name;
      const rawArgs = singleFunc.parameters;
      const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : (rawArgs || {});
      const res = await this.dispatchTool(name, args, callId, callerNumber);
      return { result: res };
    }

    return { result: { success: false, error: 'No tool call found in payload.' } };
  }

  /**
   * Dispatch Tool Calls to Domain Services
   */
  private async dispatchTool(
    toolName: string,
    args: any,
    callId: string,
    callerNumber?: string
  ): Promise<any> {
    const normalizedPhone = callerNumber ? this.appointmentService.normalizePhone(callerNumber) : '';

    switch (toolName) {
      case 'getHospitalInfo': {
        const info = this.fileRepo.getHospitalInfo();
        return {
          success: true,
          data: {
            name: info.name,
            tagline: info.tagline,
            address: info.address,
            phone: info.phone,
            emergencyPhone: info.emergencyPhone,
            email: info.email,
            operatingHours: info.operatingHours,
            certifications: info.certifications
          }
        };
      }

      case 'getDepartments': {
        const depts = this.fileRepo.getDepartments().filter(d => d.active).map(d => ({
          id: d.id,
          name: d.name,
          code: d.code,
          description: d.description
        }));
        return { success: true, count: depts.length, data: depts };
      }

      case 'getServices': {
        const services = this.fileRepo.getServices().filter(s => s.active).map(s => ({
          id: s.id,
          name: s.name,
          description: s.shortDescription
        }));
        return { success: true, count: services.length, data: services };
      }

      case 'getFacilities': {
        const facilities = this.fileRepo.getFacilities().filter(f => f.active).map(f => ({
          id: f.id,
          name: f.name,
          description: f.description
        }));
        return { success: true, count: facilities.length, data: facilities };
      }

      case 'searchDoctors': {
        const { department, specialization, name } = args;
        let docs = this.fileRepo.getDoctors().filter(d => d.active);

        if (department) {
          const deptQuery = String(department).toLowerCase();
          docs = docs.filter(d =>
            d.departmentId.toLowerCase() === deptQuery ||
            (d.departmentName && d.departmentName.toLowerCase().includes(deptQuery))
          );
        }
        if (specialization) {
          docs = docs.filter(d => d.specialization.toLowerCase().includes(String(specialization).toLowerCase()));
        }
        if (name) {
          docs = docs.filter(d => d.name.toLowerCase().includes(String(name).toLowerCase()));
        }

        const safeDocs = docs.map(d => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization,
          departmentName: d.departmentName,
          experienceYears: d.experienceYears,
          languages: d.languages,
          consultationFee: d.consultationFee
        }));
        return { success: true, count: safeDocs.length, data: safeDocs };
      }

      case 'getDoctorDetails': {
        const doc = this.fileRepo.getDoctorById(args.doctorId || args.id);
        if (!doc || !doc.active) return { success: false, error: 'Doctor not found.' };
        return {
          success: true,
          data: {
            id: doc.id,
            name: doc.name,
            qualification: doc.qualification,
            specialization: doc.specialization,
            departmentName: doc.departmentName,
            experienceYears: doc.experienceYears,
            languages: doc.languages,
            bio: doc.bio
          }
        };
      }

      case 'checkDoctorAvailability': {
        const { doctorId, date } = args;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const check = this.appointmentService.checkDoctorAvailability(doctorId, targetDate);

        const standardSlots = [
          { time: '09:00 AM', available: check.available },
          { time: '10:00 AM', available: check.available },
          { time: '11:00 AM', available: check.available },
          { time: '04:00 PM', available: check.available },
          { time: '05:00 PM', available: check.available }
        ];

        return {
          success: true,
          doctorId,
          date: targetDate,
          available: check.available,
          reason: check.reason,
          slots: standardSlots
        };
      }

      case 'createAppointment': {
        try {
          const { patientName, phone, departmentId, doctorId, date, time, reason, language } = args;
          const patientPhone = phone || normalizedPhone;

          const appointment = await this.appointmentService.createAppointment({
            patientName,
            patientPhone,
            departmentId,
            doctorId,
            preferredDate: date,
            preferredTime: time,
            reason: reason || 'Voice OPD Booking',
            source: language === 'kn' ? 'VOICE_KANNADA' : 'VOICE_ENGLISH',
            language: language === 'kn' ? 'KN' : 'EN',
            idempotencyKey: `vapi_${callId}_${date}_${doctorId}`,
            agentSessionId: callId
          });

          // Log Successful Voice Appointment Call Session
          this.logCallSession({
            callId,
            phoneNumber: patientPhone,
            status: 'COMPLETED',
            outcome: 'APPOINTMENT_CREATED',
            appointmentId: appointment.id,
            language: language === 'kn' ? 'KN' : 'EN',
            summary: `Appointment ${appointment.id} created for ${patientName} with ${appointment.doctorName} on ${date}`
          });

          return {
            success: true,
            appointmentId: appointment.id,
            message: `Appointment confirmed! Your appointment ID is ${appointment.id}.`,
            appointment
          };
        } catch (err: any) {
          this.logCallSession({
            callId,
            phoneNumber: args.phone || normalizedPhone || 'UNKNOWN',
            status: 'FAILED',
            outcome: 'TECHNICAL_FAILURE',
            summary: `Appointment creation failed: ${err.message}`
          });
          return { success: false, error: err.message || 'Appointment creation failed.' };
        }
      }

      case 'requestHumanAssistance': {
        const hospital = this.fileRepo.getHospitalInfo();
        this.logCallSession({
          callId,
          phoneNumber: normalizedPhone || 'UNKNOWN',
          status: 'COMPLETED',
          outcome: 'HUMAN_HANDOFF',
          summary: 'Caller requested human reception staff assistance.'
        });
        return {
          success: true,
          handoffNumber: hospital.phone,
          message: `Transferring caller to human reception desk at ${hospital.phone}.`
        };
      }

      case 'handleEmergency': {
        const hospital = this.fileRepo.getHospitalInfo();
        this.logCallSession({
          callId,
          phoneNumber: normalizedPhone || 'UNKNOWN',
          status: 'COMPLETED',
          outcome: 'EMERGENCY_ESCALATED',
          summary: 'Medical emergency triggered during phone call.'
        });
        return {
          success: true,
          emergencyLine: hospital.emergencyPhone || '108',
          instructions: 'Please stay calm. Immediate emergency assistance required. Call 108 immediately or visit Emergency Room.'
        };
      }

      default:
        return { success: false, error: `Unknown tool name: ${toolName}` };
    }
  }

  /**
   * Process n8n Webhook Payload for Automated Voice Actions
   */
  public async handleN8nWebhook(body: any): Promise<any> {
    const action = body.action || body.event || body.toolName || 'createAppointment';
    const params = body.parameters || body.data || body;
    const callId = body.callId || `n8n_call_${Date.now()}`;
    const callerNumber = body.callerNumber || params.phone;

    return await this.dispatchTool(action, params, callId, callerNumber);
  }

  /**
   * Log Voice Call Session to Persistent Audit Store
   */
  private logCallSession(params: {
    callId: string;
    phoneNumber: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    outcome: VoiceCallOutcome;
    appointmentId?: string;
    language?: 'KN' | 'EN' | 'KANGLISH';
    summary?: string;
  }) {
    const existingCalls = this.fileRepo.getVoiceCalls();
    const existing = existingCalls.find(c => c.callId === params.callId);

    const callRecord: VoiceCall = {
      id: existing ? existing.id : `vcall_${Date.now()}`,
      callId: params.callId,
      phoneNumber: params.phoneNumber,
      startedAt: existing ? existing.startedAt : new Date().toISOString(),
      endedAt: new Date().toISOString(),
      language: params.language || existing?.language || 'KANGLISH',
      status: params.status,
      appointmentId: params.appointmentId || existing?.appointmentId,
      outcome: params.outcome,
      summary: params.summary || existing?.summary,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    this.fileRepo.saveVoiceCall(callRecord);
  }
}

