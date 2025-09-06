// Recommended Booking Flow Configuration
export const BOOKING_CONFIG = {
    // Strong ID generation
    generateBookingId: () => {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `APT-${year}-${result}`;
    },

    // Recommended flow steps
    STEPS: {
        SERVICE: 1,
        SPECIALIST: 2,
        DATE: 3,
        TIME: 4,
        DETAILS: 5,
        CONFIRMATION: 6
    },

    // UI Configuration
    UI: {
        ICONS: {
            service: 'fas fa-stethoscope',
            specialist: 'fas fa-user-md',
            date: 'fas fa-calendar-alt',
            time: 'fas fa-clock',
            total: 'fas fa-dollar-sign',
            success: 'fas fa-check',
            info: 'fas fa-info-circle',
            copy: 'fas fa-copy',
            edit: 'fas fa-edit',
            plus: 'fas fa-plus'
        },
        COLORS: {
            primary: '#1CBC9B',
            secondary: '#16a085',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        }
    },

    // Copy functionality
    copyToClipboard: (text) => {
        return navigator.clipboard.writeText(text).then(() => {
            const notification = document.createElement('div');
            notification.className = 'booking-notification success show';
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">✓</span>
                    <span class="notification-message">Copied to clipboard!</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 2000);
        });
    }
};

// Export for WordPress integration
if (typeof window !== 'undefined') {
    window.BOOKING_CONFIG = BOOKING_CONFIG;
}