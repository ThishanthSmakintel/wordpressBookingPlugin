<?php

if (!defined('ABSPATH')) {
    exit;
}

class Appointease_Heartbeat_Handler {
    
    public function __construct() {
        add_filter('heartbeat_received', array($this, 'handle_heartbeat'), 10, 2);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_heartbeat_scripts'));
    }

    public function enqueue_heartbeat_scripts() {
        if (is_admin()) return;
        
        wp_enqueue_script('heartbeat');
        wp_add_inline_script('heartbeat', '
            jQuery(document).ready(function($) {
                wp.heartbeat.interval("15");
            });
        ');
    }

    public function handle_heartbeat($response, $data) {
        if (!isset($data['appointease_booking'])) {
            return $response;
        }

        $booking_data = $data['appointease_booking'];
        
        switch ($booking_data['action']) {
            case 'get_user_data':
                $response['appointease_booking'] = $this->get_user_booking_data($booking_data);
                break;
                
            case 'validate_booking':
                $response['appointease_booking'] = $this->validate_booking_data($booking_data);
                break;
                
            case 'check_availability':
                $response['appointease_booking'] = $this->check_slot_availability($booking_data);
                break;
                
            case 'cancel_appointment':
                $response['appointease_booking'] = $this->cancel_appointment($booking_data);
                break;
                
            case 'reschedule_appointment':
                $response['appointease_booking'] = $this->reschedule_appointment($booking_data);
                break;
                
            case 'confirm_booking':
                $response['appointease_booking'] = $this->confirm_booking($booking_data);
                break;
                
            case 'send_otp':
                $response['appointease_booking'] = $this->send_otp($booking_data);
                break;
                
            case 'verify_otp':
                $response['appointease_booking'] = $this->verify_otp($booking_data);
                break;
        }

        return $response;
    }

    private function get_user_booking_data($data) {
        if (!isset($data['user_email'])) {
            return array('error' => 'Email required');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $appointments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE email = %s AND status != 'cancelled' ORDER BY appointment_date ASC",
            $data['user_email']
        ));

        $formatted_appointments = array();
        foreach ($appointments as $apt) {
            $formatted_appointments[] = array(
                'id' => 'APT-' . date('Y') . '-' . str_pad($apt->id, 6, '0', STR_PAD_LEFT),
                'service_name' => $apt->service_name ?? 'Service',
                'staff_name' => $apt->staff_name ?? 'Staff Member',
                'appointment_date' => $apt->appointment_date,
                'status' => $apt->status,
                'name' => $apt->name,
                'email' => $apt->email,
                'created_at' => $apt->created_at,
                'rescheduled_at' => $apt->rescheduled_at ?? null,
                'original_date' => $apt->original_date ?? null
            );
        }

        return array(
            'appointments' => $formatted_appointments,
            'timestamp' => time()
        );
    }

    private function validate_booking_data($data) {
        $errors = array();

        // Server-side validation
        if (empty($data['firstName'])) {
            $errors['firstName'] = 'First name is required';
        }

        if (empty($data['lastName'])) {
            $errors['lastName'] = 'Last name is required';
        }

        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Valid email is required';
        }

        if (empty($data['phone']) || !preg_match('/^[\+]?[1-9][\d]{0,15}$/', preg_replace('/\s/', '', $data['phone']))) {
            $errors['phone'] = 'Valid phone number is required';
        }

        if (empty($data['service_id'])) {
            $errors['service'] = 'Service selection is required';
        }

        if (empty($data['staff_id'])) {
            $errors['staff'] = 'Staff selection is required';
        }

        if (empty($data['date']) || !$this->is_valid_date($data['date'])) {
            $errors['date'] = 'Valid date is required';
        }

        if (empty($data['time']) || !$this->is_valid_time($data['time'])) {
            $errors['time'] = 'Valid time is required';
        }

        // Check slot availability
        if (empty($errors) && !$this->is_slot_available($data['date'], $data['time'], $data['staff_id'])) {
            $errors['time'] = 'Selected time slot is no longer available';
        }

        return array(
            'validation_errors' => $errors,
            'is_valid' => empty($errors)
        );
    }

    private function check_slot_availability($data) {
        if (!isset($data['date']) || !isset($data['staff_id'])) {
            return array('error' => 'Date and staff ID required');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $booked_slots = $wpdb->get_col($wpdb->prepare(
            "SELECT TIME(appointment_date) as time_slot FROM $table_name 
             WHERE DATE(appointment_date) = %s AND staff_id = %d AND status != 'cancelled'",
            $data['date'],
            $data['staff_id']
        ));

        $available_slots = $this->generate_time_slots();
        $available_slots = array_diff($available_slots, $booked_slots);

        return array(
            'available_slots' => array_values($available_slots),
            'booked_slots' => $booked_slots
        );
    }

    private function is_valid_date($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date && $d >= new DateTime('today');
    }

    private function is_valid_time($time) {
        $t = DateTime::createFromFormat('H:i', $time);
        return $t && $t->format('H:i') === $time;
    }

    private function is_slot_available($date, $time, $staff_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $datetime = $date . ' ' . $time . ':00';
        
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name 
             WHERE appointment_date = %s AND staff_id = %d AND status != 'cancelled'",
            $datetime,
            $staff_id
        ));

        return $count == 0;
    }

    private function generate_time_slots() {
        $slots = array();
        $start = new DateTime('09:00');
        $end = new DateTime('17:00');
        $interval = new DateInterval('PT30M');

        while ($start < $end) {
            $slots[] = $start->format('H:i');
            $start->add($interval);
        }

        return $slots;
    }

    private function cancel_appointment($data) {
        if (!isset($data['appointment_id']) || !isset($data['user_email'])) {
            return array('error' => 'Appointment ID and email required');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $result = $wpdb->update(
            $table_name,
            array('status' => 'cancelled'),
            array(
                'id' => str_replace('AE', '', $data['appointment_id']),
                'email' => $data['user_email']
            ),
            array('%s'),
            array('%d', '%s')
        );

        if ($result !== false) {
            return $this->get_user_booking_data($data);
        }

        return array('error' => 'Failed to cancel appointment');
    }

    private function reschedule_appointment($data) {
        if (!isset($data['appointment_id']) || !isset($data['new_date']) || !isset($data['new_time'])) {
            return array('error' => 'Missing required data');
        }

        $new_datetime = $data['new_date'] . ' ' . $data['new_time'] . ':00';
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        // Get current appointment date for original_date tracking
        $current_apt = $wpdb->get_row($wpdb->prepare(
            "SELECT appointment_date, original_date FROM $table_name WHERE id = %d AND email = %s",
            str_replace(['APT-' . date('Y') . '-', 'AE'], '', $data['appointment_id']),
            $data['user_email']
        ));
        
        $original_date = $current_apt->original_date ?? $current_apt->appointment_date;
        
        $result = $wpdb->update(
            $table_name,
            array(
                'appointment_date' => $new_datetime,
                'rescheduled_at' => current_time('mysql'),
                'original_date' => $original_date
            ),
            array(
                'id' => str_replace(['APT-' . date('Y') . '-', 'AE'], '', $data['appointment_id']),
                'email' => $data['user_email']
            ),
            array('%s', '%s', '%s'),
            array('%d', '%s')
        );

        if ($result !== false) {
            return $this->get_user_booking_data($data);
        }

        return array('error' => 'Failed to reschedule appointment');
    }

    private function confirm_booking($data) {
        // Validate required fields
        $required_fields = ['firstName', 'lastName', 'email', 'phone', 'service_id', 'staff_id', 'date', 'time'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return array('error' => ucfirst($field) . ' is required');
            }
        }

        // Server-side validation
        $validation_result = $this->validate_booking_data($data);
        if (!$validation_result['is_valid']) {
            return $validation_result;
        }

        // Check slot availability one more time
        if (!$this->is_slot_available($data['date'], $data['time'], $data['staff_id'])) {
            return array('error' => 'Time slot is no longer available');
        }

        // Insert booking
        global $wpdb;
        $table_name = $wpdb->prefix . 'appointments';
        
        $appointment_datetime = $data['date'] . ' ' . $data['time'] . ':00';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'name' => $data['firstName'] . ' ' . $data['lastName'],
                'email' => sanitize_email($data['email']),
                'phone' => sanitize_text_field($data['phone']),
                'service_id' => intval($data['service_id']),
                'staff_id' => intval($data['staff_id']),
                'appointment_date' => $appointment_datetime,
                'status' => 'confirmed',
                'created_at' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s')
        );

        if ($result !== false) {
            $appointment_id = 'APT-' . date('Y') . '-' . str_pad($wpdb->insert_id, 6, '0', STR_PAD_LEFT);
            
            return array(
                'booking_confirmed' => true,
                'appointment_id' => $appointment_id,
                'message' => 'Booking confirmed successfully'
            );
        }

        return array('error' => 'Failed to create booking');
    }
}