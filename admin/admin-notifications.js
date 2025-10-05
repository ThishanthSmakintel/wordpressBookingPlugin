// Admin Panel Real-time Notifications
(function($) {
    'use strict';

    class AdminNotifications {
        constructor() {
            this.notifications = [];
            this.isPolling = false;
            this.lastCheck = Date.now();
            this.unreadCount = 0;
            this.processedIds = new Set();
            this.init();
        }

        init() {
            this.createNotificationBell();
            this.createNotificationContainer();
            this.startPolling();
            this.bindEvents();
        }

        createNotificationBell() {
            const adminBar = $('#wp-admin-bar-root-default');
            if (!adminBar.length || $('#wp-admin-bar-appointease-notifications').length) return;

            const bellHtml = `
                <li id="wp-admin-bar-appointease-notifications">
                    <a class="ab-item" href="#" id="appointease-bell">
                        <span class="ab-icon dashicons dashicons-bell"></span>
                        <span id="notification-count" class="notification-count" style="display: none;">0</span>
                    </a>
                    <div id="notification-dropdown" class="notification-dropdown" style="display: none;">
                        <div class="notification-header">
                            <span>Notifications</span>
                            <button id="mark-all-read" class="mark-all-read">Mark all as read</button>
                        </div>
                        <div id="notification-list" class="notification-list">
                            <div class="no-notifications">No new notifications</div>
                        </div>
                    </div>
                </li>
            `;
            
            adminBar.append(bellHtml);
            this.addNotificationStyles();
        }

        addNotificationStyles() {
            if ($('#appointease-notification-styles').length) return;
            
            const style = $(`<style id="appointease-notification-styles">
                .notification-count {
                    background: #d63638 !important;
                    color: white !important;
                    border-radius: 50% !important;
                    padding: 2px 6px !important;
                    font-size: 11px !important;
                    position: absolute !important;
                    top: 6px !important;
                    right: 6px !important;
                    min-width: 16px !important;
                    text-align: center !important;
                    line-height: 1 !important;
                }
                .notification-dropdown {
                    position: absolute !important;
                    top: 100% !important;
                    right: 0 !important;
                    background: white !important;
                    border: 1px solid #ccd0d4 !important;
                    border-radius: 4px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
                    width: 320px !important;
                    max-height: 400px !important;
                    z-index: 99999 !important;
                }
                .notification-header {
                    padding: 12px 16px !important;
                    border-bottom: 1px solid #ddd !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    font-weight: 600 !important;
                }
                .mark-all-read {
                    background: #0073aa !important;
                    color: white !important;
                    border: none !important;
                    padding: 4px 8px !important;
                    border-radius: 3px !important;
                    cursor: pointer !important;
                    font-size: 11px !important;
                }
                .mark-all-read:hover {
                    background: #005a87 !important;
                }
                .notification-list {
                    max-height: 300px !important;
                    overflow-y: auto !important;
                }
                .notification-item {
                    padding: 12px 16px !important;
                    border-bottom: 1px solid #f0f0f1 !important;
                    cursor: pointer !important;
                    background: #f8f9fa !important;
                }
                .notification-item:hover {
                    background: #e8f4f8 !important;
                }
                .notification-item.read {
                    background: white !important;
                    opacity: 0.7 !important;
                }
                .notification-title {
                    font-weight: 600 !important;
                    margin-bottom: 4px !important;
                }
                .notification-time {
                    font-size: 11px !important;
                    color: #666 !important;
                }
                .no-notifications {
                    padding: 20px !important;
                    text-align: center !important;
                    color: #666 !important;
                }
                #wp-admin-bar-appointease-notifications {
                    position: relative !important;
                }
            </style>`);
            $('head').append(style);
        }

        createNotificationContainer() {
            if ($('#appointease-notifications').length) return;

            const container = $(`
                <div id="appointease-notifications" style="
                    position: fixed;
                    top: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 999999;
                    max-width: 350px;
                "></div>
            `);
            $('body').append(container);
        }

        startPolling() {
            if (this.isPolling) return;
            this.isPolling = true;
            
            // Poll every 5 seconds for new appointments
            setInterval(() => {
                this.checkForNewAppointments();
            }, 5000);
        }

        async checkForNewAppointments() {
            try {
                const response = await $.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'get_notification_queue',
                        _wpnonce: appointeaseAdmin?.nonce || ''
                    }
                });

                if (response.success && response.data.length > 0) {
                    response.data.forEach(appointment => {
                        this.showNotification(appointment);
                    });
                }
            } catch (error) {
                console.error('Failed to check for new appointments:', error);
            }
        }

        showNotification(appointment) {
            const notificationId = `notification-${appointment.id}-${Date.now()}`;
            
            // Add to bell dropdown
            this.addToBellDropdown(appointment);
            
            const notification = $(`
                <div id="${notificationId}" class="appointease-notification" style="
                    background: white;
                    border-left: 4px solid #10b981;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    margin-bottom: 10px;
                    padding: 16px;
                    transform: translateY(-100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                ">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="
                            background: #10b981;
                            color: white;
                            border-radius: 50%;
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            flex-shrink: 0;
                        ">📅</div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                                New Appointment Booked
                            </div>
                            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                                ${appointment.name} • ${appointment.service_name || 'Service'}
                            </div>
                            <div style="font-size: 12px; color: #9ca3af;">
                                ${new Date(appointment.appointment_date).toLocaleString()}
                            </div>
                            <div style="margin-top: 8px; display: flex; gap: 8px;">
                                <button class="view-appointment" data-id="${appointment.id}" style="
                                    background: #3b82f6;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    padding: 4px 8px;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">View</button>
                                <button class="dismiss-notification" style="
                                    background: #f3f4f6;
                                    color: #6b7280;
                                    border: none;
                                    border-radius: 4px;
                                    padding: 4px 8px;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">Dismiss</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            $('#appointease-notifications').prepend(notification);

            // Animate in
            setTimeout(() => {
                notification.css({
                    transform: 'translateY(0)',
                    opacity: 1
                });
            }, 100);

            // Auto dismiss after 10 seconds
            setTimeout(() => {
                this.dismissNotification(notificationId);
            }, 10000);

            // Play notification sound
            this.playNotificationSound();
        }

        addToBellDropdown(appointment) {
            this.notifications.unshift({
                id: appointment.id,
                name: appointment.name,
                service: appointment.service_name || 'Service',
                date: appointment.appointment_date,
                time: Date.now(),
                read: false
            });
            
            this.unreadCount++;
            this.updateBellCounter();
            this.updateDropdownList();
        }

        updateBellCounter() {
            const counter = $('#notification-count');
            if (this.unreadCount > 0) {
                counter.text(this.unreadCount).show();
            } else {
                counter.hide();
            }
        }

        updateDropdownList() {
            const list = $('#notification-list');
            
            if (this.notifications.length === 0) {
                list.html('<div class="no-notifications">No new notifications</div>');
                return;
            }
            
            const html = this.notifications.map(notif => `
                <div class="notification-item ${notif.read ? 'read' : ''}" data-id="${notif.id}">
                    <div class="notification-title">New Appointment: ${notif.name}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${notif.service}</div>
                    <div class="notification-time">${new Date(notif.date).toLocaleString()}</div>
                </div>
            `).join('');
            
            list.html(html);
        }

        markAllAsRead() {
            this.notifications.forEach(notif => notif.read = true);
            this.unreadCount = 0;
            this.updateBellCounter();
            this.updateDropdownList();
        }

        dismissNotification(notificationId) {
            const notification = $(`#${notificationId}`);
            notification.css({
                transform: 'translateY(-100%)',
                opacity: 0
            });
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }

        playNotificationSound() {
            // Create a subtle notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }

        bindEvents() {
            $(document).on('click', '.dismiss-notification', function() {
                const notification = $(this).closest('.appointease-notification');
                const notificationId = notification.attr('id');
                window.adminNotifications.dismissNotification(notificationId);
            });

            $(document).on('click', '.view-appointment', function() {
                const appointmentId = $(this).data('id');
                window.location.href = `admin.php?page=appointease-appointments&highlight=${appointmentId}`;
            });

            // Bell dropdown events
            $(document).on('click', '#appointease-bell', function(e) {
                e.preventDefault();
                const dropdown = $('#notification-dropdown');
                dropdown.toggle();
            });

            $(document).on('click', '#mark-all-read', function() {
                window.adminNotifications.markAllAsRead();
            });

            $(document).on('click', '.notification-item', function() {
                const appointmentId = $(this).data('id');
                window.location.href = `admin.php?page=appointease-appointments&highlight=${appointmentId}`;
            });

            // Close dropdown when clicking outside
            $(document).on('click', function(e) {
                if (!$(e.target).closest('#wp-admin-bar-appointease-notifications').length) {
                    $('#notification-dropdown').hide();
                }
            });
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        // Initialize on all admin pages
        if ($('body').hasClass('wp-admin')) {
            window.adminNotifications = new AdminNotifications();
        }
    });

})(jQuery);