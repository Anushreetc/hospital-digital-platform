from datetime import time
from .database import engine, init_db, SessionLocal
from .models import Department, Doctor, Availability

def seed_database():
    init_db()
    db = SessionLocal()

    # Check if already seeded
    if db.query(Department).first():
        print("[DB Seed] Voice agent database already seeded.")
        db.close()
        return

    print("[DB Seed] Seeding Voice Agent database...")

    # Departments (English + Kannada)
    depts_data = [
        {"name_en": "Cardiology", "name_kn": "ಹೃದಯ ಚಿಕಿತ್ಸೆ", "description": "Heart & Vascular Care"},
        {"name_en": "Orthopedics", "name_kn": "ಅಸ್ಥಿರೋಗ ಚಿಕಿತ್ಸೆ", "description": "Bone, Joint & Spine Care"},
        {"name_en": "Neurology", "name_kn": "ನರರೋಗ ಚಿಕಿತ್ಸೆ", "description": "Brain & Nervous System Care"},
        {"name_en": "Pediatrics", "name_kn": "ಮಕ್ಕಳ ಚಿಕಿತ್ಸೆ", "description": "Child Health & Pediatrics"},
        {"name_en": "General Medicine", "name_kn": "ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ", "description": "General Health & OPD Checkups"},
    ]

    dept_objs = {}
    for d in depts_data:
        dept = Department(**d)
        db.add(dept)
        db.flush()
        dept_objs[d["name_en"]] = dept.id

    # Doctors
    doctors_data = [
        {"name": "Dr. Rajesh Sharma", "qualification": "MBBS, MD, DM (Cardiology)", "department_id": dept_objs["Cardiology"], "consult_minutes": 15},
        {"name": "Dr. Sunita Patel", "qualification": "MBBS, DNB (Cardiology)", "department_id": dept_objs["Cardiology"], "consult_minutes": 15},
        {"name": "Dr. Ananya Rao", "qualification": "MBBS, MS (Orthopedics)", "department_id": dept_objs["Orthopedics"], "consult_minutes": 20},
        {"name": "Dr. Vikram Hegde", "qualification": "MBBS, D.Ortho", "department_id": dept_objs["Orthopedics"], "consult_minutes": 20},
        {"name": "Dr. Suresh Kumar", "qualification": "MBBS, DM (Neurology)", "department_id": dept_objs["Neurology"], "consult_minutes": 15},
        {"name": "Dr. Priya Nair", "qualification": "MBBS, MD (Pediatrics)", "department_id": dept_objs["Pediatrics"], "consult_minutes": 15},
        {"name": "Dr. Ramesh Chandra", "qualification": "MBBS, MD (General Medicine)", "department_id": dept_objs["General Medicine"], "consult_minutes": 15},
    ]

    doc_objs = []
    for doc in doctors_data:
        d_obj = Doctor(**doc)
        db.add(d_obj)
        db.flush()
        doc_objs.append(d_obj.id)

    # Availability (Mon=0 to Sat=5)
    for doc_id in doc_objs:
        for weekday in range(0, 6):  # Mon-Sat
            avail = Availability(
                doctor_id=doc_id,
                weekday=weekday,
                start_time=time(9, 0),
                end_time=time(13, 0)
            )
            avail_eve = Availability(
                doctor_id=doc_id,
                weekday=weekday,
                start_time=time(16, 0),
                end_time=time(19, 0)
            )
            db.add(avail)
            db.add(avail_eve)

    db.commit()
    print("[DB Seed] Successfully seeded departments, doctors, and weekly OPD schedules!")
    db.close()

if __name__ == "__main__":
    seed_database()
