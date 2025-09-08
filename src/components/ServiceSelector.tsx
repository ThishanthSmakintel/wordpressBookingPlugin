import React from 'react';
import { useBookingStore } from '../store/bookingStore';

interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
}

interface ServiceSelectorProps {
    onRetry: () => void;
    columns?: number;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
    onRetry,
    columns = 2
}) => {
    const { services, servicesLoading, isOnline, setSelectedService, setStep } = useBookingStore();
    
    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setStep(2);
    };
    return (
        <div className="appointease-step-content">
            <div className="progress-bar">
                <div className="progress-fill" style={{width: '20%'}}></div>
            </div>
            <h2>Choose Your Service</h2>
            <p className="step-description">Select the service you'd like to book</p>
            
            {!isOnline && (
                <div className="offline-banner">
                    <i className="fas fa-wifi"></i>
                    You are offline. Limited functionality available.
                </div>
            )}

            <div className="services-grid" style={{gridTemplateColumns: `repeat(${columns}, 1fr)`}} role="grid" aria-label="Available services">
                {servicesLoading ? (
                    Array.from({length: 4}).map((_, index) => (
                        <div key={index} className="service-card skeleton skeleton-card" aria-hidden="true">
                            <div className="skeleton-text short"></div>
                            <div className="skeleton-text medium"></div>
                            <div className="skeleton-text long"></div>
                        </div>
                    ))
                ) : services.length === 0 ? (
                    <div className="empty-state" role="status">
                        <i className="fas fa-briefcase" aria-hidden="true"></i>
                        <h3>No Services Available</h3>
                        <p>Please try again later or contact support.</p>
                        <button className="retry-btn" onClick={onRetry}>
                            <i className="fas fa-redo"></i> Retry
                        </button>
                    </div>
                ) : (
                    services.map(service => (
                        <div 
                            key={service.id} 
                            className="service-card" 
                            onClick={() => handleServiceSelect(service)}
                            onKeyDown={(e) => e.key === 'Enter' && handleServiceSelect(service)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Select ${service.name} service, ${service.duration} minutes, $${service.price}`}
                        >
                            <div className="service-icon" aria-hidden="true"><i className="ri-briefcase-line"></i></div>
                            <div className="service-info">
                                <h3>{service.name}</h3>
                                <p>{service.description}</p>
                                <div className="service-meta">
                                    <span className="duration"><i className="ri-time-line" aria-hidden="true"></i> {service.duration} min</span>
                                    <span className="price"><i className="ri-money-dollar-circle-line" aria-hidden="true"></i> ${service.price}</span>
                                </div>
                            </div>
                            <div className="service-arrow" aria-hidden="true"><i className="ri-arrow-right-line"></i></div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;