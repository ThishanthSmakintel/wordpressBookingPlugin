-- Run these queries in phpMyAdmin to check actual database data

-- 1. Check all staff members
SELECT id, name, email, phone, created_at 
FROM wp_appointease_staff 
ORDER BY id;

-- 2. Check the appointment at 09:15
SELECT id, strong_id, name, email, employee_id, appointment_date, status 
FROM wp_appointments 
WHERE DATE(appointment_date) = '2025-11-06' 
  AND TIME(appointment_date) = '09:15:00';

-- 3. Check if Employee ID 1 exists
SELECT * FROM wp_appointease_staff WHERE id = 1;

-- 4. Check what employee_id the 09:15 appointment has
SELECT a.id, a.strong_id, a.employee_id, s.name as staff_name, s.email as staff_email
FROM wp_appointments a
LEFT JOIN wp_appointease_staff s ON a.employee_id = s.id
WHERE DATE(a.appointment_date) = '2025-11-06' 
  AND TIME(a.appointment_date) = '09:15:00';
