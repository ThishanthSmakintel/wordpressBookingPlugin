-- Fix Employee ID 1 data
-- Run this in phpMyAdmin or MySQL command line

-- First, check current data
SELECT * FROM wp_appointease_staff WHERE id = 1;

-- Update Employee ID 1 with complete data
UPDATE wp_appointease_staff 
SET 
    name = 'Sarah Johnson',
    email = 'sarah@appointease.com',
    phone = '555-0123',
    working_hours = '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}',
    avatar = 'SJ',
    created_at = NOW()
WHERE id = 1;

-- Verify the update
SELECT * FROM wp_appointease_staff WHERE id = 1;
