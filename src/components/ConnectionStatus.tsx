import React from 'react';

interface ConnectionStatusProps {
    isOnline: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isOnline }) => {
    if (isOnline) return null;

    return (
        <div className="connection-status show" role="alert">
            <i className="fas fa-wifi"></i>
            You are offline
        </div>
    );
};

export default ConnectionStatus;