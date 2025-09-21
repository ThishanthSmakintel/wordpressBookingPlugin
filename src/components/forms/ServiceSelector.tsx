import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Service } from '../../types';

interface ServiceSelectorProps {
    onRetry: () => void;
    columns?: number;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = React.memo(({
    onRetry,
    columns = 2
}) => {
    const { services, servicesLoading, isOnline, selectedService, setSelectedService, setStep } = useBookingStore();
    const [tempSelected, setTempSelected] = useState<Service | null>(selectedService);
    
    const handleServiceSelect = (service: Service) => {
        setTempSelected(service);
    };
    
    const handleNext = () => {
        if (tempSelected) {
            setSelectedService(tempSelected);
            setStep(2);
        }
    };
    
    return (
        <div className="appointease-step-content">
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '2rem', color: '#1f2937'}}>Choose Your Service</h2>
            
            {!isOnline && (
                <div style={{backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', marginBottom: '24px', textAlign: 'center'}}>
                    <i className="fas fa-wifi" style={{marginRight: '8px'}}></i>
                    You are offline. Limited functionality available.
                </div>
            )}

            <div style={{maxWidth: '600px', margin: '0 auto'}}>
                {servicesLoading ? (
                    Array.from({length: 2}).map((_, index) => (
                        <div key={index} style={{
                            backgroundColor: '#f3f4f6',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '16px',
                            height: '120px',
                            animation: 'pulse 2s infinite'
                        }}>
                            <div style={{backgroundColor: '#e5e7eb', height: '20px', borderRadius: '4px', marginBottom: '12px', width: '60%'}}></div>
                            <div style={{backgroundColor: '#e5e7eb', height: '16px', borderRadius: '4px', marginBottom: '8px', width: '80%'}}></div>
                            <div style={{backgroundColor: '#e5e7eb', height: '16px', borderRadius: '4px', width: '40%'}}></div>
                        </div>
                    ))
                ) : services.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '48px'}}>
                        <i className="fas fa-briefcase" style={{fontSize: '3rem', color: '#9ca3af', marginBottom: '16px'}}></i>
                        <h3 style={{color: '#374151', marginBottom: '8px'}}>No Services Available</h3>
                        <p style={{color: '#6b7280', marginBottom: '24px'}}>Please try again later or contact support.</p>
                        <button 
                            onClick={onRetry}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fas fa-redo" style={{marginRight: '8px'}}></i> Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {services.map(service => {
                            const isSelected = tempSelected?.id === service.id;
                            return (
                                <div 
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '24px',
                                        marginBottom: '16px',
                                        backgroundColor: 'white',
                                        border: isSelected ? '3px solid var(--button-bg, #10b981)' : '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 4px 12px rgba(var(--button-bg-rgb, 16, 185, 129), 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = '#d1d5db';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                                        }
                                    }}
                                >
                                    {/* Radio Button */}
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: '2px solid #d1d5db',
                                        marginRight: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? 'var(--button-bg, #10b981)' : 'white',
                                        borderColor: isSelected ? 'var(--button-bg, #10b981)' : '#d1d5db'
                                    }}>
                                        {isSelected && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: 'white'
                                            }}></div>
                                        )}
                                    </div>
                                    
                                    {/* Service Content */}
                                    <div style={{flex: '1'}}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: 'var(--text-primary, #1f2937)',
                                            marginBottom: '8px'
                                        }}>
                                            {service.name}
                                        </h3>
                                        <p style={{
                                            color: '#6b7280',
                                            marginBottom: '12px',
                                            fontSize: '0.95rem'
                                        }}>
                                            {service.description}
                                        </p>
                                        <div style={{display: 'flex', gap: '16px'}}>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontSize: '0.875rem',
                                                color: '#374151'
                                            }}>
                                                <i className="fas fa-clock" style={{marginRight: '6px', color: '#6b7280'}}></i>
                                                {service.duration} min
                                            </span>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontSize: '0.875rem',
                                                color: '#374151',
                                                fontWeight: '600'
                                            }}>
                                                <i className="fas fa-dollar-sign" style={{marginRight: '6px', color: '#6b7280'}}></i>
                                                ${service.price}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Next Button */}
                        <div style={{textAlign: 'center', marginTop: '32px'}}>
                            <button 
                                onClick={handleNext}
                                disabled={!tempSelected}
                                style={{
                                    backgroundColor: tempSelected ? 'var(--button-bg, #10b981)' : '#d1d5db',
                                    color: tempSelected ? 'var(--button-text, white)' : 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '16px 32px',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: tempSelected ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                    minWidth: '200px'
                                }}
                                onMouseEnter={(e) => {
                                    if (tempSelected) {
                                        e.currentTarget.style.backgroundColor = 'var(--button-bg-hover, #059669)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (tempSelected) {
                                        e.currentTarget.style.backgroundColor = 'var(--button-bg, #10b981)';
                                    }
                                }}
                            >
                                Next: Choose Employee →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

export default ServiceSelector;