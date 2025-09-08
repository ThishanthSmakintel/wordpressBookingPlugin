import React from 'react';
import { useBookingStore } from '../store/bookingStore';

interface Employee {
    id: number;
    name: string;
    avatar: string;
    rating: number;
    reviews: number;
}

interface EmployeeSelectorProps {
    onRetry: () => void;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
    onRetry
}) => {
    const { employees, employeesLoading, setSelectedEmployee, setStep } = useBookingStore();
    
    const handleEmployeeSelect = (employee: Employee) => {
        setSelectedEmployee(employee);
        setStep(3);
    };
    
    const handleBack = () => {
        setStep(1);
    };
    return (
        <div className="appointease-step-content">
            <div className="progress-bar">
                <div className="progress-fill" style={{width: '40%'}}></div>
            </div>
            <h2>Choose Your Specialist</h2>
            <p className="step-description">Select who you'd like to work with</p>

            <div className="employees-grid" role="grid" aria-label="Available specialists">
                {employeesLoading ? (
                    Array.from({length: 3}).map((_, index) => (
                        <div key={index} className="employee-card skeleton skeleton-card" aria-hidden="true">
                            <div className="skeleton-text short"></div>
                            <div className="skeleton-text medium"></div>
                        </div>
                    ))
                ) : employees.length === 0 ? (
                    <div className="empty-state" role="status">
                        <i className="fas fa-user-md" aria-hidden="true"></i>
                        <h3>No Specialists Available</h3>
                        <p>Please try again later or contact support.</p>
                        <button className="retry-btn" onClick={onRetry}>
                            <i className="fas fa-redo"></i> Retry
                        </button>
                    </div>
                ) : (
                    employees.map(employee => (
                        <div 
                            key={employee.id} 
                            className="employee-card" 
                            onClick={() => handleEmployeeSelect(employee)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEmployeeSelect(employee)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Select ${employee.name}, rated ${employee.rating} stars with ${employee.reviews} reviews`}
                        >
                            <div className="employee-avatar" aria-hidden="true">{employee.avatar}</div>
                            <div className="employee-info">
                                <h3>{employee.name}</h3>
                                <div className="employee-rating">
                                    <span className="rating"><i className="ri-star-fill" aria-hidden="true"></i> {employee.rating}</span>
                                    <span className="reviews">({employee.reviews} reviews)</span>
                                </div>
                            </div>
                            <div className="employee-arrow" aria-hidden="true"><i className="ri-arrow-right-line"></i></div>
                        </div>
                    ))
                )}
            </div>
            <div className="form-actions">
                <button className="back-btn" onClick={handleBack} aria-label="Go back to service selection">
                    <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                </button>
            </div>
        </div>
    );
};

export default EmployeeSelector;