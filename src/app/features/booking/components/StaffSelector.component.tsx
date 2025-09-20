import React, { useState } from 'react';
import { useBookingStore } from '../../../shared/store/bookingStore';
import { Employee } from '../../../shared/types/booking.types';

interface StaffSelectorProps {
    onRetry: () => void;
}

export const StaffSelector: React.FC<StaffSelectorProps> = ({
    onRetry
}) => {
    const { employees, employeesLoading, selectedEmployee, setSelectedEmployee, setStep } = useBookingStore();
    const [tempSelected, setTempSelected] = useState<Employee | null>(selectedEmployee);
    
    const handleEmployeeSelect = (employee: Employee) => {
        setTempSelected(employee);
    };
    
    const handleNext = () => {
        if (tempSelected) {
            setSelectedEmployee(tempSelected);
            setStep(3);
        }
    };
    
    const handleBack = () => {
        setStep(1);
    };
    
    return (
        <div className="appointease-step-content">
            <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '2rem', color: '#1f2937'}}>Choose Your Specialist</h2>

            <div style={{maxWidth: '600px', margin: '0 auto'}}>
                {employeesLoading ? (
                    Array.from({length: 3}).map((_, index) => (
                        <div key={index} style={{
                            backgroundColor: '#f3f4f6',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '16px',
                            height: '100px',
                            animation: 'pulse 2s infinite'
                        }}>
                            <div style={{backgroundColor: '#e5e7eb', height: '20px', borderRadius: '4px', marginBottom: '12px', width: '60%'}}></div>
                            <div style={{backgroundColor: '#e5e7eb', height: '16px', borderRadius: '4px', width: '40%'}}></div>
                        </div>
                    ))
                ) : employees.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '48px'}}>
                        <i className="fas fa-user-md" style={{fontSize: '3rem', color: '#9ca3af', marginBottom: '16px'}}></i>
                        <h3 style={{color: '#374151', marginBottom: '8px'}}>No Specialists Available</h3>
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
                        {employees.map(employee => {
                            const isSelected = tempSelected?.id === employee.id;
                            return (
                                <div 
                                    key={employee.id}
                                    onClick={() => handleEmployeeSelect(employee)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '24px',
                                        marginBottom: '16px',
                                        backgroundColor: 'white',
                                        border: isSelected ? '3px solid #10b981' : '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: '2px solid #d1d5db',
                                        marginRight: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? '#10b981' : 'white',
                                        borderColor: isSelected ? '#10b981' : '#d1d5db'
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
                                    
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginRight: '20px'
                                    }}>
                                        {employee.avatar}
                                    </div>
                                    
                                    <div style={{flex: '1'}}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: '#1f2937',
                                            marginBottom: '8px'
                                        }}>
                                            {employee.name}
                                        </h3>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontSize: '0.875rem',
                                                color: '#f59e0b'
                                            }}>
                                                <i className="fas fa-star" style={{marginRight: '4px'}}></i>
                                                {employee.rating}
                                            </span>
                                            <span style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280'
                                            }}>
                                                ({employee.reviews} reviews)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '32px'}}>
                            <button 
                                onClick={handleBack}
                                style={{
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                ← Back
                            </button>
                            <button 
                                onClick={handleNext}
                                disabled={!tempSelected}
                                style={{
                                    backgroundColor: tempSelected ? '#10b981' : '#d1d5db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '16px 32px',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: tempSelected ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Next: Choose Date →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};