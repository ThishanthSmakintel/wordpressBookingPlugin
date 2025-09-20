<?php

// Add database reset admin page
add_action('admin_menu', function() {
    add_submenu_page(
        'booking-admin',
        'Database Reset',
        'Database Reset',
        'manage_options',
        'booking-db-reset',
        'booking_plugin_db_reset_page'
    );
});

function booking_plugin_db_reset_page() {
    // Get current table counts
    $counts = apply_filters('appointease_get_table_counts', null);
    ?>
    <div class="wrap">
        <h1>Database Reset</h1>
        
        <div class="notice notice-warning">
            <p><strong>Warning:</strong> These actions will permanently delete data. Make sure you have a backup before proceeding.</p>
        </div>
        
        <div class="card">
            <h2>Current Database Status</h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Table</th>
                        <th>Records</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($counts as $table => $count): ?>
                    <tr>
                        <td><?php echo esc_html($table); ?></td>
                        <td><?php echo esc_html($count); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>Reset Options</h2>
            
            <div class="reset-section">
                <h3>Complete Database Reset</h3>
                <p>This will reset all plugin data and restore default settings.</p>
                <button id="reset-all-btn" class="button button-primary button-large" style="background-color: #dc3545; border-color: #dc3545;">
                    Reset All Data
                </button>
            </div>
            
            <hr>
            
            <div class="reset-section">
                <h3>Individual Table Reset</h3>
                <p>Reset specific tables only:</p>
                
                <div class="table-reset-buttons">
                    <button class="button reset-table-btn" data-table="appointments">Reset Appointments</button>
                    <button class="button reset-table-btn" data-table="customers">Reset Customers</button>
                    <button class="button reset-table-btn" data-table="services">Reset Services</button>
                    <button class="button reset-table-btn" data-table="staff">Reset Staff</button>
                </div>
            </div>
        </div>
    </div>
    
    <style>
    .card {
        background: #fff;
        border: 1px solid #ccd0d4;
        border-radius: 4px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 1px 1px rgba(0,0,0,.04);
    }
    
    .reset-section {
        margin: 20px 0;
    }
    
    .table-reset-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .reset-table-btn {
        background-color: #f39c12;
        border-color: #f39c12;
        color: white;
    }
    
    .reset-table-btn:hover {
        background-color: #e67e22;
        border-color: #e67e22;
    }
    </style>
    
    <script>
    jQuery(document).ready(function($) {
        // Complete reset
        $('#reset-all-btn').on('click', function() {
            if (confirm('Are you sure you want to reset ALL plugin data? This action cannot be undone!')) {
                if (confirm('This will delete all appointments, customers, and settings. Are you absolutely sure?')) {
                    resetDatabase();
                }
            }
        });
        
        // Individual table reset
        $('.reset-table-btn').on('click', function() {
            const table = $(this).data('table');
            if (confirm(`Are you sure you want to reset the ${table} table? This action cannot be undone!`)) {
                resetTable(table);
            }
        });
        
        function resetDatabase() {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'appointease_reset_db',
                    nonce: '<?php echo wp_create_nonce('appointease_reset_nonce'); ?>'
                },
                beforeSend: function() {
                    $('#reset-all-btn').prop('disabled', true).text('Resetting...');
                },
                success: function(response) {
                    if (response.success) {
                        alert('Database reset successfully!');
                        location.reload();
                    } else {
                        alert('Error: ' + (response.error || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('AJAX error occurred');
                },
                complete: function() {
                    $('#reset-all-btn').prop('disabled', false).text('Reset All Data');
                }
            });
        }
        
        function resetTable(table) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'appointease_reset_table',
                    table: table,
                    nonce: '<?php echo wp_create_nonce('appointease_reset_nonce'); ?>'
                },
                beforeSend: function() {
                    $(`.reset-table-btn[data-table="${table}"]`).prop('disabled', true).text('Resetting...');
                },
                success: function(response) {
                    if (response.success) {
                        alert(`${table.charAt(0).toUpperCase() + table.slice(1)} reset successfully!`);
                        location.reload();
                    } else {
                        alert('Error: ' + (response.error || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('AJAX error occurred');
                },
                complete: function() {
                    $(`.reset-table-btn[data-table="${table}"]`).prop('disabled', false).text(`Reset ${table.charAt(0).toUpperCase() + table.slice(1)}`);
                }
            });
        }
    });
    </script>
    <?php
}