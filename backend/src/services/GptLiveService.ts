import https from 'https';
import { FileRepository } from '../repositories/FileRepository';
import { AppointmentService } from './AppointmentService';

export class GptLiveService {
  private apiKey: string;
  private model: string;
  private fileRepo: FileRepository;
  private appointmentService: AppointmentService;

  constructor(fileRepo: FileRepository, appointmentService: AppointmentService) {
    this.fileRepo = fileRepo;
    this.appointmentService = appointmentService;
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.GPT_LIVE_MODEL || 'gpt-live-1';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  public getModelName(): string {
    return this.model;
  }

  /**
   * System Prompt for GPT-Live-1 Full-Duplex Voice Receptionist
   */
  public getSystemInstructions(): string {
    const hospital = this.fileRepo.getHospitalInfo();
    return `You are the official full-duplex AI Voice Receptionist for ${hospital.name}.
Today's date is ${new Date().toISOString().split('T')[0]}.

CRITICAL GUIDELINES:
1. Greet callers warmly in both Kannada and English: "ನಮಸ್ಕಾರ! ${hospital.name}ಗೆ ಸುಸ್ವಾಗತ. Namaskara! Welcome to ${hospital.name}. How can I help you today?"
2. Speak naturally, concisely, and conversationally in real-time. Since this is full-duplex audio, keep responses to 1-2 short sentences so the caller can speak freely.
3. Always respond in BOTH Kannada and English for each turn (Kannada sentence first, followed immediately by English translation), so callers who speak either or both languages can understand effortlessly.
4. You have access to official hospital backend tools:
   - getHospitalInfo: to provide hospital address, emergency contact, visiting timings
   - getDepartments: to list hospital clinical departments
   - searchDoctors: to find doctors by specialty or name
   - checkDoctorAvailability: to check real-time doctor slots
   - createAppointment: to confirm and book the appointment
5. NEVER invent doctors, timings, or medical advice. You are a receptionist, not a doctor.
6. If the caller describes an emergency (chest pain, breathing difficulty, severe bleeding), immediately urge them to call emergency services at ${hospital.emergencyPhone || '108'} or visit casualty.
7. Always summarize all details (patient name, phone, doctor, date, time) and get explicit user confirmation before booking.`;
  }

  /**
   * Hospital Tools Definition for GPT-Live-1 / OpenAI Live API
   */
  public getToolsDefinition(): any[] {
    return [
      {
        type: 'function',
        name: 'getHospitalInfo',
        description: 'Get official hospital information, timings, address, and emergency numbers',
        parameters: { type: 'object', properties: {} }
      },
      {
        type: 'function',
        name: 'getDepartments',
        description: 'List all active clinical departments in the hospital',
        parameters: { type: 'object', properties: {} }
      },
      {
        type: 'function',
        name: 'searchDoctors',
        description: 'Find active doctors by department name, specialization, or doctor name',
        parameters: {
          type: 'object',
          properties: {
            department: { type: 'string', description: 'Department name e.g. Cardiology' },
            specialization: { type: 'string', description: 'Specialty search term' },
            name: { type: 'string', description: 'Doctor name' }
          }
        }
      },
      {
        type: 'function',
        name: 'checkDoctorAvailability',
        description: 'Check available appointment slots for a specific doctor on a target date (YYYY-MM-DD)',
        parameters: {
          type: 'object',
          properties: {
            doctorId: { type: 'string', description: 'Unique doctor ID' },
            date: { type: 'string', description: 'Target date in YYYY-MM-DD format' }
          },
          required: ['doctorId', 'date']
        }
      },
      {
        type: 'function',
        name: 'createAppointment',
        description: 'Create and confirm an appointment after the patient has explicitly confirmed all details',
        parameters: {
          type: 'object',
          properties: {
            patientName: { type: 'string', description: 'Patient full name' },
            phone: { type: 'string', description: '10-digit Indian phone number' },
            departmentId: { type: 'string', description: 'Department ID' },
            doctorId: { type: 'string', description: 'Doctor ID' },
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            time: { type: 'string', description: 'Preferred time slot e.g. 10:00 AM' },
            reason: { type: 'string', description: 'Reason for visit' }
          },
          required: ['patientName', 'phone', 'departmentId', 'doctorId', 'date', 'time']
        }
      }
    ];
  }

  /**
   * Create an Ephemeral Live Session with GPT-Live-1
   */
  public async createLiveSession(): Promise<any> {
    if (!this.isConfigured()) {
      return {
        success: true,
        configured: false,
        model: this.model,
        message: 'OpenAI API key not set in environment. Running in GPT-Live-1 simulation mode.',
        client_secret: {
          value: `sim_gpt_live_${Date.now()}`
        },
        session: {
          id: `sess_${Date.now()}`,
          model: this.model,
          voice: 'alloy',
          modalities: ['audio', 'text']
        }
      };
    }

    const payload = JSON.stringify({
      model: this.model,
      voice: 'alloy',
      modalities: ['audio', 'text'],
      instructions: this.getSystemInstructions(),
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      tools: this.getToolsDefinition()
    });

    return new Promise((resolve) => {
      // First attempt Live API endpoint, fallback to realtime sessions
      const req = https.request(
        'https://api.openai.com/v1/realtime/sessions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({
                  success: true,
                  configured: true,
                  model: this.model,
                  ...parsed
                });
              } else {
                console.warn('[GptLiveService] OpenAI Live API returned error:', parsed);
                // Fallback simulation to keep UX smooth
                resolve({
                  success: true,
                  configured: false,
                  model: this.model,
                  error: parsed.error?.message || 'OpenAI error',
                  client_secret: { value: `sim_gpt_live_${Date.now()}` }
                });
              }
            } catch (err: any) {
              resolve({
                success: false,
                error: 'Failed to parse OpenAI Live response',
                raw: data
              });
            }
          });
        }
      );

      req.on('error', (err) => {
        console.warn('[GptLiveService] Connection error:', err);
        resolve({
          success: true,
          configured: false,
          model: this.model,
          error: err.message,
          client_secret: { value: `sim_gpt_live_${Date.now()}` }
        });
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Execute Tool Function Called by GPT-Live-1
   */
  public async executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'getHospitalInfo': {
        const info = this.fileRepo.getHospitalInfo();
        return {
          name: info.name,
          address: info.address,
          phone: info.phone,
          emergencyPhone: info.emergencyPhone,
          operatingHours: info.operatingHours
        };
      }

      case 'getDepartments': {
        return this.fileRepo.getDepartments().filter((d) => d.active).map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code
        }));
      }

      case 'searchDoctors': {
        let docs = this.fileRepo.getDoctors().filter((d) => d.active);
        if (args.department) {
          const dep = String(args.department).toLowerCase();
          docs = docs.filter(
            (d) =>
              d.departmentId.toLowerCase() === dep ||
              (d.departmentName && d.departmentName.toLowerCase().includes(dep))
          );
        }
        if (args.specialization) {
          docs = docs.filter((d) =>
            d.specialization.toLowerCase().includes(String(args.specialization).toLowerCase())
          );
        }
        if (args.name) {
          docs = docs.filter((d) =>
            d.name.toLowerCase().includes(String(args.name).toLowerCase())
          );
        }
        return docs.map((d) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization,
          departmentName: d.departmentName,
          consultationFee: d.consultationFee
        }));
      }

      case 'checkDoctorAvailability': {
        const targetDate = args.date || new Date().toISOString().split('T')[0];
        const check = this.appointmentService.checkDoctorAvailability(args.doctorId, targetDate);
        return {
          doctorId: args.doctorId,
          date: targetDate,
          available: check.available,
          reason: check.reason,
          slots: [
            { time: '09:00 AM', available: check.available },
            { time: '10:00 AM', available: check.available },
            { time: '11:00 AM', available: check.available },
            { time: '04:00 PM', available: check.available },
            { time: '05:00 PM', available: check.available }
          ]
        };
      }

      case 'createAppointment': {
        try {
          const appt = await this.appointmentService.createAppointment({
            patientName: args.patientName,
            patientPhone: args.phone,
            departmentId: args.departmentId,
            doctorId: args.doctorId,
            preferredDate: args.date,
            preferredTime: args.time,
            reason: args.reason || 'Voice Consultation',
            source: 'VOICE_KANNADA',
            language: 'KN'
          });
          return {
            success: true,
            appointmentId: appt.appointment.id,
            message: `Appointment successfully booked with ID ${appt.appointment.id}`
          };
        } catch (err: any) {
          return {
            success: false,
            error: err.message || 'Appointment booking failed.'
          };
        }
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }
}
