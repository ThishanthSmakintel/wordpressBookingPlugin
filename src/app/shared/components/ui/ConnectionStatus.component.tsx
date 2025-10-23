import React from 'react';
import { useAppointmentStore as useBookingStore } from '../../hooks/useAppointmentStore';
import { UI_COLORS } from '../../constants/booking.constants';

export const ConnectionStatus: React.FC = () => {
    const { isOnline } = useBookingStore();
    if (isOnline) return null;

    return (
        <div className="connection-status show" role="alert">
            <i className="fas fa-wifi"></i>
            You are offline
        </div>
    );
};
