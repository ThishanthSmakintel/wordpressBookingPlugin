<?php
/**
 * AppointEase API Debug Panel
 * Access: http://blog.promoplus.com/wp-content/plugins/wordpressBookingPlugin/api-debug-panel.php
 */
require_once(dirname(dirname(dirname(dirname(__FILE__)))) . '/wp-load.php');

if (!current_user_can('manage_options')) {
    wp_die('Access denied. Admin only.');
}

$nonce = wp_create_nonce('wp_rest');
$api_root = rest_url();
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AppointEase API Debug Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { opacity: 0.9; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        @media (max-width: 1024px) { .grid { grid-template-columns: 1fr; } }
        .card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h2 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .endpoint { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
        .endpoint-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; }
        .method.get { background: #28a745; }
        .method.post { background: #007bff; }
        .method.put { background: #ffc107; color: #333; }
        .method.delete { background: #dc3545; }
        .endpoint-url { font-family: 'Courier New', monospace; font-size: 13px; color: #666; margin-bottom: 10px; word-break: break-all; }
        .params { margin: 10px 0; }
        .params input, .params textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; font-size: 13px; }
        .params textarea { min-height: 80px; font-family: 'Courier New', monospace; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5568d3; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #218838; }
        .response { margin-top: 10px; padding: 15px; background: #1e1e1e; color: #d4d4d4; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; max-height: 300px; overflow: auto; display: none; }
        .response.show { display: block; }
        .response.success { border-left: 4px solid #28a745; }
        .response.error { border-left: 4px solid #dc3545; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 10px; }
        .status-200 { background: #d4edda; color: #155724; }
        .status-400, .status-404 { background: #f8d7da; color: #721c24; }
        .status-500 { background: #f5c6cb; color: #721c24; }
        .loading { display: none; }
        .loading.show { display: inline-block; margin-left: 10px; }
        .spinner { border: 2px solid #f3f3f3; border-top: 2px solid #667eea; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .info-box strong { color: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 AppointEase API Debug Panel</h1>
            <p>Test all REST API endpoints with live requests</p>
        </div>

        <div class="info-box">
            <strong>API Root:</strong> <?php echo esc_html($api_root); ?><br>
            <strong>Nonce:</strong> <code><?php echo esc_html($nonce); ?></code>
        </div>

        <div class="grid">
            <!-- Services & Staff -->
            <div class="card">
                <h2>📋 Services & Staff</h2>
                
                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Get Services</div>
                        <button class="btn btn-primary" onclick="testAPI('get-services')">Test</button>
                    </div>
                    <div class="endpoint-url">/booking/v1/services</div>
                    <div class="loading" id="loading-get-services"><div class="spinner"></div></div>
                    <div class="response" id="response-get-services"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Get Staff</div>
                        <button class="btn btn-primary" onclick="testAPI('get-staff')">Test</button>
                    </div>
                    <div class="endpoint-url">/booking/v1/staff</div>
                    <div class="loading" id="loading-get-staff"><div class="spinner"></div></div>
                    <div class="response" id="response-get-staff"></div>
                </div>
            </div>

            <!-- Availability -->
            <div class="card">
                <h2>📅 Availability</h2>
                
                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method post">POST</span> Check Availability</div>
                        <button class="btn btn-primary" onclick="testAPI('check-availability')">Test</button>
                    </div>
                    <div class="endpoint-url">/booking/v1/availability</div>
                    <div class="params">
                        <input type="date" id="avail-date" placeholder="Date" value="<?php echo date('Y-m-d', strtotime('+1 day')); ?>">
                        <input type="number" id="avail-employee" placeholder="Employee ID" value="1">
                    </div>
                    <div class="loading" id="loading-check-availability"><div class="spinner"></div></div>
                    <div class="response" id="response-check-availability"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Business Hours</div>
                        <button class="btn btn-primary" onclick="testAPI('business-hours')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/business-hours</div>
                    <div class="loading" id="loading-business-hours"><div class="spinner"></div></div>
                    <div class="response" id="response-business-hours"></div>
                </div>
            </div>

            <!-- Appointments -->
            <div class="card">
                <h2>📝 Appointments</h2>
                
                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method post">POST</span> Create Appointment</div>
                        <button class="btn btn-primary" onclick="testAPI('create-appointment')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/appointments</div>
                    <div class="params">
                        <input type="text" id="apt-name" placeholder="Name" value="Test User">
                        <input type="email" id="apt-email" placeholder="Email" value="test@example.com">
                        <input type="tel" id="apt-phone" placeholder="Phone" value="1234567890">
                        <input type="datetime-local" id="apt-date" value="<?php echo date('Y-m-d\TH:i', strtotime('+1 day 10:00')); ?>">
                        <input type="number" id="apt-service" placeholder="Service ID" value="1">
                        <input type="number" id="apt-employee" placeholder="Employee ID" value="1">
                    </div>
                    <div class="loading" id="loading-create-appointment"><div class="spinner"></div></div>
                    <div class="response" id="response-create-appointment"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Get Appointment</div>
                        <button class="btn btn-primary" onclick="testAPI('get-appointment')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/appointments/{id}</div>
                    <div class="params">
                        <input type="text" id="get-apt-id" placeholder="Appointment ID (e.g., APT-2025-000001)" value="APT-2025-000209">
                    </div>
                    <div class="loading" id="loading-get-appointment"><div class="spinner"></div></div>
                    <div class="response" id="response-get-appointment"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method delete">DELETE</span> Cancel Appointment</div>
                        <button class="btn btn-primary" onclick="testAPI('cancel-appointment')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/appointments/{id}</div>
                    <div class="params">
                        <input type="text" id="cancel-apt-id" placeholder="Appointment ID" value="APT-2025-000209">
                    </div>
                    <div class="loading" id="loading-cancel-appointment"><div class="spinner"></div></div>
                    <div class="response" id="response-cancel-appointment"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method put">PUT</span> Reschedule Appointment</div>
                        <button class="btn btn-primary" onclick="testAPI('reschedule-appointment')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/appointments/{id}</div>
                    <div class="params">
                        <input type="text" id="reschedule-apt-id" placeholder="Appointment ID" value="APT-2025-000001">
                        <input type="datetime-local" id="reschedule-date" value="<?php echo date('Y-m-d\TH:i', strtotime('+2 days 14:00')); ?>">
                    </div>
                    <div class="loading" id="loading-reschedule-appointment"><div class="spinner"></div></div>
                    <div class="response" id="response-reschedule-appointment"></div>
                </div>
            </div>

            <!-- User Management -->
            <div class="card">
                <h2>👤 User Management</h2>
                
                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method post">POST</span> Get User Appointments</div>
                        <button class="btn btn-primary" onclick="testAPI('user-appointments')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/user-appointments</div>
                    <div class="params">
                        <input type="email" id="user-email" placeholder="Email" value="dev15.smakintel@gmail.com">
                    </div>
                    <div class="loading" id="loading-user-appointments"><div class="spinner"></div></div>
                    <div class="response" id="response-user-appointments"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Check Customer</div>
                        <button class="btn btn-primary" onclick="testAPI('check-customer')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/check-customer/{email}</div>
                    <div class="params">
                        <input type="email" id="check-email" placeholder="Email" value="test@example.com">
                    </div>
                    <div class="loading" id="loading-check-customer"><div class="spinner"></div></div>
                    <div class="response" id="response-check-customer"></div>
                </div>
            </div>

            <!-- System -->
            <div class="card">
                <h2>⚙️ System</h2>
                
                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Server Date</div>
                        <button class="btn btn-primary" onclick="testAPI('server-date')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/server-date</div>
                    <div class="loading" id="loading-server-date"><div class="spinner"></div></div>
                    <div class="response" id="response-server-date"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Settings</div>
                        <button class="btn btn-primary" onclick="testAPI('settings')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/settings</div>
                    <div class="loading" id="loading-settings"><div class="spinner"></div></div>
                    <div class="response" id="response-settings"></div>
                </div>

                <div class="endpoint">
                    <div class="endpoint-header">
                        <div><span class="method get">GET</span> Debug Appointments</div>
                        <button class="btn btn-primary" onclick="testAPI('debug-appointments')">Test</button>
                    </div>
                    <div class="endpoint-url">/appointease/v1/debug/appointments</div>
                    <div class="loading" id="loading-debug-appointments"><div class="spinner"></div></div>
                    <div class="response" id="response-debug-appointments"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_ROOT = '<?php echo esc_js($api_root); ?>';
        const NONCE = '<?php echo esc_js($nonce); ?>';

        async function testAPI(endpoint) {
            const loadingEl = document.getElementById(`loading-${endpoint}`);
            const responseEl = document.getElementById(`response-${endpoint}`);
            
            loadingEl.classList.add('show');
            responseEl.classList.remove('show', 'success', 'error');
            responseEl.innerHTML = '';

            try {
                let url, method, body;

                switch(endpoint) {
                    case 'get-services':
                        url = `${API_ROOT}booking/v1/services`;
                        method = 'GET';
                        break;
                    case 'get-staff':
                        url = `${API_ROOT}booking/v1/staff`;
                        method = 'GET';
                        break;
                    case 'check-availability':
                        url = `${API_ROOT}booking/v1/availability`;
                        method = 'POST';
                        body = JSON.stringify({
                            date: document.getElementById('avail-date').value,
                            employee_id: parseInt(document.getElementById('avail-employee').value)
                        });
                        break;
                    case 'business-hours':
                        url = `${API_ROOT}appointease/v1/business-hours`;
                        method = 'GET';
                        break;
                    case 'create-appointment':
                        url = `${API_ROOT}appointease/v1/appointments`;
                        method = 'POST';
                        body = JSON.stringify({
                            name: document.getElementById('apt-name').value,
                            email: document.getElementById('apt-email').value,
                            phone: document.getElementById('apt-phone').value,
                            date: document.getElementById('apt-date').value.replace('T', ' ') + ':00',
                            service_id: parseInt(document.getElementById('apt-service').value),
                            employee_id: parseInt(document.getElementById('apt-employee').value)
                        });
                        break;
                    case 'get-appointment':
                        const getAptId = document.getElementById('get-apt-id').value;
                        url = `${API_ROOT}appointease/v1/appointments/${getAptId}`;
                        method = 'GET';
                        break;
                    case 'cancel-appointment':
                        const cancelAptId = document.getElementById('cancel-apt-id').value;
                        url = `${API_ROOT}appointease/v1/appointments/${cancelAptId}`;
                        method = 'DELETE';
                        break;
                    case 'reschedule-appointment':
                        const rescheduleAptId = document.getElementById('reschedule-apt-id').value;
                        url = `${API_ROOT}appointease/v1/appointments/${rescheduleAptId}`;
                        method = 'PUT';
                        body = JSON.stringify({
                            new_date: document.getElementById('reschedule-date').value.replace('T', ' ') + ':00'
                        });
                        break;
                    case 'user-appointments':
                        url = `${API_ROOT}appointease/v1/user-appointments`;
                        method = 'POST';
                        body = JSON.stringify({
                            email: document.getElementById('user-email').value
                        });
                        break;
                    case 'check-customer':
                        const checkEmail = encodeURIComponent(document.getElementById('check-email').value);
                        url = `${API_ROOT}appointease/v1/check-customer/${checkEmail}`;
                        method = 'GET';
                        break;
                    case 'server-date':
                        url = `${API_ROOT}appointease/v1/server-date`;
                        method = 'GET';
                        break;
                    case 'settings':
                        url = `${API_ROOT}appointease/v1/settings`;
                        method = 'GET';
                        break;
                    case 'debug-appointments':
                        url = `${API_ROOT}appointease/v1/debug/appointments`;
                        method = 'GET';
                        break;
                }

                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': NONCE
                    },
                    credentials: 'same-origin'
                };

                if (body) options.body = body;

                const response = await fetch(url, options);
                const data = await response.json();

                const statusClass = response.ok ? 'success' : 'error';
                const statusBadge = `<span class="status-badge status-${response.status}">${response.status} ${response.statusText}</span>`;
                
                responseEl.innerHTML = statusBadge + '\n\n' + JSON.stringify(data, null, 2);
                responseEl.classList.add('show', statusClass);

            } catch (error) {
                responseEl.innerHTML = `<span class="status-badge status-500">ERROR</span>\n\n${error.message}`;
                responseEl.classList.add('show', 'error');
            } finally {
                loadingEl.classList.remove('show');
            }
        }
    </script>
</body>
</html>
