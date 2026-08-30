from sqlalchemy import (Column, Integer, String, Date, Time, Boolean,
                        ForeignKey, DateTime, UniqueConstraint)
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True)
    name_en = Column(String, nullable=False, unique=True)
    name_kn = Column(String)  # ಹೃದಯ ಚಿಕಿತ್ಸೆ etc.
    description = Column(String)
    doctors = relationship("Doctor", back_populates="department")

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    qualification = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    consult_minutes = Column(Integer, default=15)
    active = Column(Boolean, default=True)
    department = relationship("Department", back_populates="doctors")
    availability = relationship("Availability", back_populates="doctor")

class Availability(Base):
    """Recurring weekly schedule. Mon=0 ... Sun=6"""
    __tablename__ = "availability"
    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    weekday = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    doctor = relationship("Doctor", back_populates="availability")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, nullable=False)
    appt_date = Column(Date, nullable=False)
    appt_time = Column(Time, nullable=False)
    status = Column(String, default="confirmed")   # confirmed | cancelled
    source = Column(String, default="voice_agent")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    __table_args__ = (UniqueConstraint("doctor_id", "appt_date", "appt_time"),)
