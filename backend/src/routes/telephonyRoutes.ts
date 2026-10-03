import { Router, Request, Response } from 'express';
import { TelephonyService } from '../services/TelephonyService';
import { FileRepository } from '../repositories/FileRepository';

export const createTelephonyRouter = (
  telephonyService: TelephonyService,
  fileRepo: FileRepository
): Router => {
  const router = Router();

  // 1. Twilio Incoming Phone Call Webhook (TwiML Generator)
  router.post('/twilio/webhook', (req: Request, res: Response) => {
    try {
      const callId = req.body.CallSid || req.query.CallSid || `twilio_call_${Date.now()}`;
      const callerNumber = req.body.From || req.query.From;

      const twimlXml = telephonyService.generateTwilioTwiML(callId, callerNumber);
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twimlXml);
    } catch (err: any) {
      console.error('[Twilio Webhook Error]:', err);
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting to hospital reception desk.</Say>
</Response>`);
    }
  });

  // 2. Vapi Server Webhook & Tool Call Dispatcher
  router.post('/vapi/webhook', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const result = await telephonyService.handleVapiToolCall(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[Vapi Webhook Error]:', err);
      return res.status(500).json({
        result: {
          success: false,
          error: err.message || 'Internal server error processing Vapi tool call.'
        }
      });
    }
  });

  // 3. n8n Automation Inbound Webhook Endpoint
  router.post('/n8n/webhook', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const result = await telephonyService.handleN8nWebhook(payload);
      return res.status(200).json({
        success: true,
        source: 'n8n_telephony_workflow',
        timestamp: new Date().toISOString(),
        data: result
      });
    } catch (err: any) {
      console.error('[n8n Webhook Error]:', err);
      return res.status(500).json({
        success: false,
        source: 'n8n_telephony_workflow',
        error: err.message || 'Error processing n8n webhook request.'
      });
    }
  });

  // 4. Calling Assistant Config Endpoint (Vapi JSON export)
  router.get('/vapi/assistant-config', (_req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.resolve(__dirname, '../../../vapi_assistant_config.json');
      if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return res.status(200).json({ success: true, config: configData });
      }
      return res.status(200).json({
        success: true,
        message: 'Vapi assistant configuration template available.'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Call Simulator Endpoint (Direct Test)
  router.post('/simulate-call', async (req: Request, res: Response) => {
    try {
      const { toolName, parameters, callerNumber } = req.body;
      const fakeCallPayload = {
        message: {
          type: 'tool-calls',
          toolCalls: [
            {
              id: `test_call_${Date.now()}`,
              function: {
                name: toolName || 'createAppointment',
                arguments: parameters || {}
              }
            }
          ],
          call: {
            id: `sim_call_${Date.now()}`,
            customer: {
              number: callerNumber || '+919876543210'
            }
          }
        }
      };

      const result = await telephonyService.handleVapiToolCall(fakeCallPayload);
      return res.status(200).json({
        success: true,
        simulation: true,
        result
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Admin Voice Calls Analytics & Logs Endpoint
  router.get('/admin/voice-calls', (_req: Request, res: Response) => {
    try {
      const calls = fileRepo.getVoiceCalls();
      const totalCalls = calls.length;
      const appointmentsCreated = calls.filter(c => c.outcome === 'APPOINTMENT_CREATED' || !!c.appointmentId).length;
      const humanHandoffs = calls.filter(c => c.outcome === 'HUMAN_HANDOFF').length;
      const emergencyEscalations = calls.filter(c => c.outcome === 'EMERGENCY_ESCALATED').length;
      const openCases = calls.filter(c => c.caseStatus === 'NEW' || c.caseStatus === 'UNDER_REVIEW').length;
      const closedCases = calls.filter(c => c.caseStatus === 'CLOSED').length;

      return res.status(200).json({
        success: true,
        analytics: {
          totalCalls,
          appointmentsCreated,
          humanHandoffs,
          emergencyEscalations,
          openCases,
          closedCases
        },
        data: calls
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Record / Save AI Receptionist Conversation Transcript
  router.post('/calls', (req: Request, res: Response) => {
    try {
      const callData = req.body;
      if (!callData.callId && !callData.id) {
        callData.callId = `call_${Date.now()}`;
      }
      if (!callData.id) {
        callData.id = callData.callId;
      }
      if (!callData.createdAt) {
        callData.createdAt = new Date().toISOString();
      }
      if (!callData.caseStatus) {
        callData.caseStatus = 'NEW';
      }

      const saved = fileRepo.saveVoiceCall(callData);
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Get All Voice Calls (With Query Filters for Receptionist Portal)
  router.get('/calls', (req: Request, res: Response) => {
    try {
      const { status, caseStatus, search, language } = req.query as Record<string, string>;
      let calls = fileRepo.getVoiceCalls();

      if (caseStatus && caseStatus !== 'ALL') {
        calls = calls.filter(c => c.caseStatus === caseStatus);
      }
      if (status && status !== 'ALL') {
        calls = calls.filter(c => c.status === status);
      }
      if (language && language !== 'ALL') {
        calls = calls.filter(c => c.language === language);
      }
      if (search) {
        const q = search.toLowerCase().trim();
        calls = calls.filter(c =>
          (c.callerName && c.callerName.toLowerCase().includes(q)) ||
          c.phoneNumber.includes(q) ||
          (c.appointmentId && c.appointmentId.toLowerCase().includes(q)) ||
          (c.summary && c.summary.toLowerCase().includes(q)) ||
          (c.transcript && c.transcript.toLowerCase().includes(q)) ||
          (c.receptionistNotes && c.receptionistNotes.toLowerCase().includes(q))
        );
      }

      const totalCalls = calls.length;
      const openCases = calls.filter(c => c.caseStatus === 'NEW' || c.caseStatus === 'UNDER_REVIEW').length;
      const closedCases = calls.filter(c => c.caseStatus === 'CLOSED').length;
      const appointmentsBooked = calls.filter(c => !!c.appointmentId).length;

      return res.status(200).json({
        success: true,
        analytics: { totalCalls, openCases, closedCases, appointmentsBooked },
        data: calls
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Get Single Voice Call Case
  router.get('/calls/:id', (req: Request, res: Response) => {
    const call = fileRepo.getVoiceCallById(req.params.id);
    if (!call) return res.status(404).json({ success: false, error: 'Voice call not found' });
    return res.status(200).json({ success: true, data: call });
  });

  // 10. Update Receptionist Case (Assign Receptionist, Notes, Under Review)
  router.patch('/calls/:id', (req: Request, res: Response) => {
    try {
      const existing = fileRepo.getVoiceCallById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, error: 'Voice call not found' });

      const updated = fileRepo.saveVoiceCall({
        ...existing,
        ...req.body,
        id: existing.id,
        callId: existing.callId
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Close Receptionist Case (Mark Resolved)
  router.post('/calls/:id/close', (req: Request, res: Response) => {
    try {
      const existing = fileRepo.getVoiceCallById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, error: 'Voice call not found' });

      const { resolutionNotes, closedBy } = req.body;
      const updated = fileRepo.saveVoiceCall({
        ...existing,
        caseStatus: 'CLOSED',
        receptionistNotes: resolutionNotes || existing.receptionistNotes || 'Case reviewed and closed.',
        closedAt: new Date().toISOString(),
        closedBy: closedBy || existing.assignedReceptionist || 'Reception Desk'
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

