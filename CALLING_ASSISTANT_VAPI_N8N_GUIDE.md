# 📞 Hospital AI Calling Assistant: Vapi.ai & n8n Integration Guide

This guide provides end-to-end instructions for deploying the **City Care Hospital AI Phone Calling Assistant** to answer inbound phone calls, converse in bilingual **Kannada & English**, check real-time doctor availability, and book OPD appointments directly into the hospital system using **Vapi.ai** and **n8n**.

---

## 🏗️ Architecture Overview

```
[Inbound Phone Call] 
       │
       ▼
[Twilio / Vonage / SIP Trunk]
       │
       ▼
 [Vapi.ai Voice Agent] (GPT-4o + Deepgram Nova-2 + ElevenLabs/Cartesia)
       │
       ├─── Option A: Direct Webhook Tool Calls ──────────► [Hospital Backend Webhook]
       │                                                         │
       └─── Option B: n8n Workflow Automation Router ─────► [n8n Webhook] ──► [Hospital API]
                                                                  │
                                                           [SMS / WhatsApp / Calendar Notification]
```

---

## 📁 Included Artifacts & Files

1. **`vapi_assistant_config.json`**: Complete Vapi Assistant configuration including system prompt, Kannada + English conversational flow, safety guardrails, and tool call schemas (`getHospitalInfo`, `getDepartments`, `searchDoctors`, `checkDoctorAvailability`, `createAppointment`, `requestHumanAssistance`, `handleEmergency`).
2. **`n8n_voice_appointment_workflow.json`**: Ready-to-import n8n workflow for routing inbound voice events, checking doctor schedules, booking appointments, and triggering notifications.
3. **Backend Telephony Endpoints**:
   - `POST /api/telephony/vapi/webhook`: Direct Vapi tool call dispatcher.
   - `POST /api/telephony/n8n/webhook`: Inbound webhook for n8n automation nodes.
   - `GET /api/telephony/vapi/assistant-config`: Live exported Vapi configuration JSON.
   - `POST /api/telephony/simulate-call`: Direct testing endpoint for simulated phone calls.
   - `GET /api/telephony/admin/voice-calls`: Call logs and analytics.

---

## 🚀 Step 1: Setting Up Vapi.ai

### 1.1 Create Account & New Assistant
1. Go to [Vapi.ai Dashboard](https://dashboard.vapi.ai) and sign up / log in.
2. Click **Assistants** -> **Create Assistant** -> Select **Blank Template**.
3. Name your assistant: `City Care Hospital Receptionist`.

### 1.2 Import Configuration JSON
1. Open the [vapi_assistant_config.json](file:///Users/Sohan/Downloads/Hospital_management/vapi_assistant_config.json) file in this project.
2. In Vapi Assistant settings:
   - Paste the **System Prompt** from the JSON.
   - Set **Model** to `OpenAI` / `gpt-4o` with Temperature `0.3`.
   - Set **Transcriber** to `Deepgram` `nova-2` (Multi-language / Indian accents).
   - Set **Voice** to `ElevenLabs` or `Cartesia` (e.g. `21m00Tcm4TlvDq8ikWAM` or preferred Indic voice).
   - Set **First Message**:
     `ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. Namaskara, welcome to City Care Hospital. How may I assist you with your appointment today?`

### 1.3 Add Function Tools in Vapi
Add the 7 functions specified in `vapi_assistant_config.json`:
- `getHospitalInfo`
- `getDepartments`
- `searchDoctors`
- `checkDoctorAvailability`
- `createAppointment`
- `requestHumanAssistance`
- `handleEmergency`

### 1.4 Set Server Webhook URL
In the **Server URL** field of your assistant, set:
```
https://<YOUR_PUBLIC_DOMAIN_OR_NGROK>/api/telephony/vapi/webhook
```
*(If developing locally, use `ngrok http 5001` or `localtunnel` to obtain a public HTTPS URL).*

---

## 🔗 Step 2: Buying / Connecting Phone Numbers

1. In Vapi Dashboard, navigate to **Phone Numbers**.
2. Click **Import Phone Number** or **Buy Phone Number**:
   - **Twilio Integration**: Link your Twilio Account SID and Auth Token, select your Indian (+91) or international DID number.
   - **SIP Trunking**: Route directly to Vapi's SIP URI.
3. Assign your phone number to the **City Care Hospital Receptionist** assistant.

---

## 🔄 Step 3: Setting Up n8n Automation Workflow

If you want an intermediate automation layer (for sending WhatsApp/SMS confirmations via Twilio/Gupshup or adding to Google Sheets / Calendar):

1. Open your n8n instance (Self-hosted or n8n Cloud).
2. Go to **Workflows** -> **Import from File...**
3. Select [n8n_voice_appointment_workflow.json](file:///Users/Sohan/Downloads/Hospital_management/n8n_voice_appointment_workflow.json).
4. Configure Environment Variables in n8n or edit the HTTP Request nodes:
   - `HOSPITAL_API_URL`: e.g. `https://your-hospital-backend.com` (or `http://localhost:5001`).
5. Activate the workflow and copy the **Production Webhook URL**.
6. (Optional) Point Vapi Server URL to the n8n Webhook URL so n8n acts as the intelligent orchestration middleware!

---

## 🧪 Step 4: Testing & Simulation

### 4.1 In-Browser Call Simulator
1. Open the hospital web application (`http://localhost:5173`).
2. Click **"AI Phone Assistant"** in the navigation bar or hero section.
3. Choose **"Live Call Simulator"**:
   - Speak or type in Kannada (`ನನಗೆ ಡಾಕ್ಟರ್ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬೇಕು`, `ರಮೇಶ್`, `9876543210`) or English (`I need an appointment with Dr. Ramesh for cardiology tomorrow at 10 AM`).
   - The assistant validates doctor availability, prevents double-booking, and returns the confirmed Appointment ID.
4. Check the **Appointments** tab in the dashboard to see the booked appointment in real time!

### 4.2 Simulated Webhook API Call
You can test the backend webhook directly with cURL:

```bash
curl -X POST http://localhost:5001/api/telephony/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCalls": [
        {
          "id": "call_test_01",
          "function": {
            "name": "createAppointment",
            "arguments": {
              "patientName": "Suresh Kumar",
              "phone": "9876543210",
              "departmentId": "dept-1",
              "doctorId": "doc-1",
              "date": "2026-09-02",
              "time": "10:00 AM",
              "reason": "Routine Cardiology Consultation",
              "language": "kn"
            }
          }
        }
      ]
    }
  }'
```

---

## 🛡️ Medical Safety & Handoff Guardrails

| Condition | Action Taken |
| :--- | :--- |
| **Emergency Mentioned** (Chest pain, unconsciousness, severe trauma) | Assistant immediately instructs caller to call **108** or go to casualty. Does NOT book standard slot. |
| **Medical Advice / Prescription Request** | Informs patient that medications and diagnoses are only provided during physical clinical examination. |
| **Caller Confused / Human Request** | Initiates warm handoff to Hospital Reception Desk (+91 80 2345 6789). |
| **Slot Already Taken (Collision)** | Real-time guard rejects collision and prompts alternative available slots on the same day. |
