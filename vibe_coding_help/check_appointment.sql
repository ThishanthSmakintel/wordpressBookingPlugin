-- Check what data is stored in the appointment APT-2025-000334

SELECT * FROM wp_appointments WHERE strong_id = 'APT-2025-000334';

-- Check if there's a staff_name or employee data stored in the appointment
SELECT 
    id,
    strong_id,
    name as customer_name,
    employee_id,
    appointment_date,
    status,
    created_at
FROM wp_appointments 
WHERE strong_id = 'APT-2025-000334';
