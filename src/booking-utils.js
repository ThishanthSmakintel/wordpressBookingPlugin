// Enhanced booking utilities for user-friendly experience

// Generate strong appointment ID
function generateAppointmentId() {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `APT-${year}-${result}`;
}

// Copy appointment ID to clipboard
function copyAppointmentId(id) {
    navigator.clipboard.writeText(id).then(() => {
        showNotification('Booking reference copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Booking reference copied!', 'success');
    });
}

// Show user-friendly notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `booking-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : 'i'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Enhanced appointment card with copy functionality
function enhanceAppointmentCard() {
    const appointmentCards = document.querySelectorAll('.appointment-card');
    
    appointmentCards.forEach(card => {
        const idElement = card.querySelector('.id-number');
        if (idElement) {
            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-id-btn';
            copyBtn.innerHTML = 'Copy';
            copyBtn.title = 'Copy appointment ID';
            copyBtn.onclick = () => copyAppointmentId(idElement.textContent);
            
            idElement.parentNode.appendChild(copyBtn);
            
            // Add click to copy functionality
            idElement.style.cursor = 'pointer';
            idElement.title = 'Click to copy';
            idElement.onclick = () => copyAppointmentId(idElement.textContent);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', enhanceAppointmentCard);