import React from 'react';
import { createRoot } from 'react-dom/client';
import { BookingApp } from './components';
import './frontend.css';
import './components/booking-components.css';
import './components/loading-states.css';

// Initialize the booking app
const initBookingApp = () => {
  const containers = document.querySelectorAll('.wp-block-appointease-booking');
  
  containers.forEach(container => {
    if (!container.hasAttribute('data-initialized')) {
      const root = createRoot(container);
      root.render(<BookingApp />);
      container.setAttribute('data-initialized', 'true');
    }
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingApp);
} else {
  initBookingApp();
}

// Re-initialize for dynamic content (AJAX, etc.)
document.addEventListener('wp-blocks-loaded', initBookingApp);