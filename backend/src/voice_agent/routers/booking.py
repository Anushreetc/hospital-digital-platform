from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from datetime import date, time, datetime, timedelta
import re

from ..database import get_db
from ..models import Department, Doctor, Availability, Appointment

router = APIRouter(prefix="/api/booking", tags=["Booking"])

@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [
        {
            "id": d.id,
            "name_en": d.name_en,
            "name_kn": d.name_kn,
            "description": d.description
        }
        for d in depts
    ]

@router.get("/doctors")
def list_doctors(department_id: int, db: Session = Depends(get_db)):
    docs = db.query(Doctor).filter_by(department_id=department_id, active=True).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "qualification": d.qualification,
            "consult_minutes": d.consult_minutes
        }
        for d in docs
    ]

@router.get("/slots")
def get_slots(doctor_id: int, on_date: date, db: Session = Depends(get_db)):
    doc = db.query(Doctor).get(doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail="doctor not found")

    # Mon=0 ... Sun=6
    weekday = on_date.weekday()
    windows = [a for a in doc.availability if a.weekday == weekday]
    if not windows:
        return {"date": str(on_date), "slots": []}

    taken = {
        a.appt_time
        for a in db.query(Appointment).filter_by(
            doctor_id=doctor_id, appt_date=on_date, status="confirmed"
        ).all()
    }

    slots = []
    step = timedelta(minutes=doc.consult_minutes)
    now = datetime.now()

    for w in windows:
        cur = datetime.combine(on_date, w.start_time)
        end = datetime.combine(on_date, w.end_time)
        while cur + step <= end:
            if cur.time() not in taken and (on_date > now.date() or cur > now):
                slots.append(cur.strftime("%H:%M"))
            cur += step

    return {"date": str(on_date), "slots": slots}

class BookingRequest(BaseModel):
    doctor_id: int
    patient_name: str = Field(min_length=2, max_length=100)
    patient_phone: str
    appt_date: date
    appt_time: time

    @field_validator("patient_phone")
    @classmethod
    def check_phone(cls, v: str):
        digits = re.sub(r"\D", "", v)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10 or digits[0] not in "6789":
            raise ValueError("invalid Indian mobile number")
        return digits

@router.post("/appointments")
def create_appointment(req: BookingRequest, db: Session = Depends(get_db)):
    # Check double booking inside database transaction
    clash = db.query(Appointment).filter_by(
        doctor_id=req.doctor_id,
        appt_date=req.appt_date,
        appt_time=req.appt_time,
        status="confirmed"
    ).first()

    if clash:
        raise HTTPException(status_code=409, detail="slot just got taken")

    appt = Appointment(
        doctor_id=req.doctor_id,
        patient_name=req.patient_name,
        patient_phone=req.patient_phone,
        appt_date=req.appt_date,
        appt_time=req.appt_time,
        status="confirmed",
        source="voice_agent"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return {
        "id": appt.id,
        "status": "confirmed",
        "reference": f"APT{appt.id:05d}",
        "message": f"Appointment APT{appt.id:05d} successfully confirmed!"
    }
