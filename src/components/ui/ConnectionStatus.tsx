import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { COLORS } from '../../constants';

const ConnectionStatus: React.FC = () => {
    const { isOnline } = useBookingStore();
    if (isOnline) return null;

    return (
        <div className="connection-status show" role="alert">
            <i className="fas fa-wifi"></i>
            You are offline
        </div>
    );
};

export default ConnectionStatus;