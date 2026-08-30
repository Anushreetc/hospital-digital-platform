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
      const appointmentsCreated = calls.filter(c => c.outcome === 'APPOINTMENT_CREATED').length;
      const humanHandoffs = calls.filter(c => c.outcome === 'HUMAN_HANDOFF').length;
      const emergencyEscalations = calls.filter(c => c.outcome === 'EMERGENCY_ESCALATED').length;

      return res.status(200).json({
        success: true,
        analytics: {
          totalCalls,
          appointmentsCreated,
          humanHandoffs,
          emergencyEscalations
        },
        data: calls
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

