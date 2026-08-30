import os
import datetime
import httpx
from livekit.agents import (
    Agent, AgentSession, JobContext, WorkerOptions,
    cli, function_tool, RunContext
)
from livekit.plugins import silero, openai
from .indic_stt import IndicConformerSTT
from .indic_tts import IndicParlerTTS

API = os.getenv("BOOKING_API_URL", "http://localhost:5001/api/booking")

SYSTEM_PROMPT = f"""You are the official hospital receptionist for City Care Hospital.
Today's date is {datetime.date.today().strftime('%Y-%m-%d')}.

Rules:
- Only mention departments, doctors, and available OPD times returned by your tools.
  Never invent a doctor, a timing, or a consultation fee.
- Speak in the language the patient uses. Both Kannada and English are fine, including mixing them naturally.
- Collect all required details: department or problem, doctor, date (YYYY-MM-DD), time, patient name, and 10-digit mobile number.
- Read the mobile number back digit-by-digit before calling the book tool.
- Keep replies to one or two short sentences. This is a real-time phone conversation.
- You do NOT give medical advice. If asked about symptoms or treatments, say a doctor will advise during consultation.
- If the patient sounds distressed or describes a medical emergency (chest pain, severe bleeding, breathing difficulty), immediately tell them to call Emergency or go to casualty. Do NOT book an appointment.
"""

class ReceptionAgent(Agent):
    def __init__(self):
        super().__init__(instructions=SYSTEM_PROMPT)

    @function_tool
    async def list_departments(self, ctx: RunContext):
        """List the hospital's departments with English and Kannada names."""
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{API}/departments")
            return r.json()

    @function_tool
    async def list_doctors(self, ctx: RunContext, department_id: int):
        """List active doctors in a department."""
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{API}/doctors", params={"department_id": department_id})
            return r.json()

    @function_tool
    async def get_slots(self, ctx: RunContext, doctor_id: int, on_date: str):
        """Get free appointment times for a doctor on a date (YYYY-MM-DD)."""
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{API}/slots", params={"doctor_id": doctor_id, "on_date": on_date})
            return r.json()

    @function_tool
    async def book(
        self,
        ctx: RunContext,
        doctor_id: int,
        patient_name: str,
        patient_phone: str,
        appt_date: str,
        appt_time: str
    ):
        """Book the appointment. Only call after patient confirms details on screen."""
        async with httpx.AsyncClient() as c:
            r = await c.post(f"{API}/appointments", json={
                "doctor_id": doctor_id,
                "patient_name": patient_name,
                "patient_phone": patient_phone,
                "appt_date": appt_date,
                "appt_time": appt_time
            })
        if r.status_code == 409:
            return {"error": "slot_taken", "message": "That slot was just taken. Please offer another time."}
        r.raise_for_status()
        return r.json()

async def entrypoint(ctx: JobContext):
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=IndicConformerSTT(lang="kn"),
        llm=openai.LLM.with_ollama(model="qwen2.5:3b-instruct-q4_K_M"),
        tts=IndicParlerTTS(),
    )
    await session.start(agent=ReceptionAgent(), room=ctx.room)
    await session.generate_reply(
        instructions="Greet the caller warmly in Kannada and English: "
                     "'Namaskara! Welcome to City Care Hospital. How can I help you today?'"
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
