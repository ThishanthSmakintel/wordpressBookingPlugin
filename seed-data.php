<?php
// Load WordPress
require_once('../../../wp-config.php');
require_once('includes/class-db-seeder.php');

echo "Seeding AppointEase data...\n";

// Run the seeder
Booking_DB_Seeder::seed_data();

echo "Data seeded successfully!\n";
echo "Added:\n";
echo "- 4 Services\n";
echo "- 4 Staff members\n";
echo "- 8 Sample appointments\n";
?>