-- The hospital confirmed Dr. Rameshwari, Dr. Ravikiran, Dr. Amod and Dr. Ramya Reddy
-- are current doctors (2 Nov 2026). Show them again, without photos until real ones
-- arrive (the site shows initials), and re-open their specialities.

-- photo_url is NOT NULL; an empty string means "no photo" to the site.
update public.doctors set active = true, photo_url = ''
where id in ('doc-102', 'doc-107', 'doc-108', 'doc-110');

update public.departments set active = true where id in ('dept-pedia', 'dept-nephro');
