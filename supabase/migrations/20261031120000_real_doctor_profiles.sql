-- Real doctor names, qualifications and photos supplied by the hospital (31 Oct 2026).
-- Photos live in public/images/doctors (square, 600x600).
-- Doctors without a supplied profile are hidden, not deleted.

update public.doctors set name = 'Dr. Chiranjeevi K S', qualification = 'MBBS, DNB (Medicine)',
  photo_url = '/images/doctors/chiranjeevi-ks.jpg' where id = 'doc-101';
update public.doctors set photo_url = '/images/doctors/rajeev.jpg' where id = 'doc-103';
update public.doctors set name = 'Dr. Sriharsha B', photo_url = '/images/doctors/sriharsha-b.jpg' where id = 'doc-104';
update public.doctors set name = 'Dr. Manasa Gowda H N', qualification = 'MBBS, MS (BMC), DNB (OBG)',
  photo_url = '/images/doctors/manasa-gowda.jpg' where id = 'doc-105';
update public.doctors set photo_url = '/images/doctors/ent-doctor.jpg' where id = 'doc-106';
update public.doctors set photo_url = '/images/doctors/sudarshan.jpg' where id = 'doc-109';
update public.doctors set name = 'Dr. Vishwanath', photo_url = '/images/doctors/vishwanath.jpg' where id = 'doc-111';
update public.doctors set name = 'Dr. Ganeshprathap', qualification = 'MBBS, MD',
  photo_url = '/images/doctors/ganesh-prathap.jpg' where id = 'doc-112';
update public.doctors set qualification = 'MBBS, MS, MCh (Neurosurgery)',
  photo_url = '/images/doctors/hariprakash.jpg' where id = 'doc-113';

update public.doctors set active = false where id in ('doc-102', 'doc-107', 'doc-108', 'doc-110');

-- Specialities with no listed doctor are hidden until a doctor is added.
update public.departments set active = false where id in ('dept-pedia', 'dept-nephro', 'dept-gastro');
