-- Create required tables for AppointEase booking system
USE blog_promoplus;

-- Main appointments table
CREATE TABLE IF NOT EXISTS wp_appointease_appointments (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    email varchar(100) NOT NULL,
    phone varchar(20) DEFAULT NULL,
    appointment_date datetime NOT NULL,
    service_id int(11) NOT NULL,
    employee_id int(11) NOT NULL,
    status enum('confirmed','cancelled','completed','no_show') DEFAULT 'confirmed',
    notes text DEFAULT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_date (appointment_date),
    KEY idx_email (email),
    KEY idx_employee (employee_id),
    KEY idx_status (status)
);

-- Services table
CREATE TABLE IF NOT EXISTS wp_appointease_services (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    description text DEFAULT NULL,
    duration int(11) NOT NULL DEFAULT 30,
    price decimal(10,2) DEFAULT 0.00,
    is_active tinyint(1) DEFAULT 1,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Staff/employees table
CREATE TABLE IF NOT EXISTS wp_appointease_staff (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    email varchar(100) NOT NULL,
    phone varchar(20) DEFAULT NULL,
    specialization varchar(100) DEFAULT NULL,
    working_hours text DEFAULT NULL,
    is_active tinyint(1) DEFAULT 1,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Slot locks table (for real-time conflict prevention)
CREATE TABLE IF NOT EXISTS wp_appointease_slot_locks (
    id int(11) NOT NULL AUTO_INCREMENT,
    date date NOT NULL,
    time time NOT NULL,
    employee_id int(11) NOT NULL,
    client_id varchar(64) NOT NULL,
    expires_at datetime NOT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_slot (date, time, employee_id),
    KEY idx_expires (expires_at),
    KEY idx_client (client_id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS wp_appointease_settings (
    id int(11) NOT NULL AUTO_INCREMENT,
    setting_key varchar(100) NOT NULL,
    setting_value longtext DEFAULT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_key (setting_key)
);

-- Insert sample data
INSERT IGNORE INTO wp_appointease_services (id, name, description, duration, price) VALUES
(1, 'Consultation', 'Initial consultation appointment', 30, 50.00),
(2, 'Follow-up', 'Follow-up appointment', 15, 25.00),
(3, 'Treatment', 'Treatment session', 60, 100.00);

INSERT IGNORE INTO wp_appointease_staff (id, name, email) VALUES
(1, 'Dr. Smith', 'smith@clinic.com'),
(2, 'Dr. Johnson', 'johnson@clinic.com'),
(3, 'Dr. Brown', 'brown@clinic.com');

-- Insert time slots setting
INSERT IGNORE INTO wp_appointease_settings (setting_key, setting_value) VALUES
('time_slots', '["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30"]');

SELECT 'Tables created successfully!' as status;