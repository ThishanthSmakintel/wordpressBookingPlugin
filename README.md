# Booking Plugin

A WordPress booking plugin with React Gutenberg support that allows users to add, cancel, and reschedule appointments.

## Features

- **Gutenberg Block**: Add booking forms to any post/page using the block editor
- **Appointment Management**: Users can book, cancel, and reschedule appointments
- **Admin Interface**: View and manage all appointments from WordPress admin
- **AJAX Support**: Seamless form submissions without page reloads

## Installation

1. Upload the plugin folder to `/wp-content/plugins/`
2. Run `npm install` to install dependencies
3. Run `npm run watch` for development (auto-rebuild on changes)
4. Activate the plugin through the 'Plugins' menu in WordPress
5. The database table will be created automatically

## Development Commands

```bash
npm run watch      # Auto-rebuild on file changes (recommended)
npm run start      # Development server with hot reload
npm run build      # Production build
npm run build:dev  # Development build with watch
```

## Usage

### Adding a Booking Form

1. Edit any post or page in Gutenberg editor
2. Add the "Appointment Booking" block
3. Publish the page

### Managing Appointments

- **Admin**: Go to "Bookings" in WordPress admin menu
- **Users**: Use the appointment ID provided after booking to manage appointments

### Booking Process

1. Fill out the booking form (name, email, phone, date/time)
2. Submit to receive an appointment ID
3. Use the ID to reschedule or cancel appointments

## Database Structure

The plugin creates a table `wp_appointments` with:
- id (primary key)
- name, email, phone (contact info)
- appointment_date (datetime)
- status (confirmed/cancelled)
- created_at (timestamp)

## Files Structure

- `booking-plugin.php` - Main plugin file
- `admin.php` - Admin interface
- `assets/block.js` - Gutenberg block registration
- `assets/frontend.js` - Frontend booking functionality