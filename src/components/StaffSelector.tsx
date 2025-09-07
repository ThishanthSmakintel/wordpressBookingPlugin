import React, { useEffect } from 'react';
import { useBooking } from '../contexts/BookingContext';
import { useAPI } from '../hooks/useAPI';

const StaffSelector: React.FC = () => {
  const { state, dispatch } = useBooking();
  const { data: staff, loading: staffLoading, request } = useAPI<any[]>();

  useEffect(() => {
    if (state.selectedService) {
      request(`appointease/v1/staff?service_id=${state.selectedService.id}`);
    }
  }, [state.selectedService, request]);

  const handleStaffSelect = (member: any) => {
    dispatch({ type: 'SET_EMPLOYEE', payload: member });
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  if (staffLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading staff...</p>
    </div>
  );

  return (
    <div className="staff-selector">
      <h3>Choose Staff Member</h3>
      <div className="staff-grid">
        {staff?.map(member => (
          <button
            key={member.id}
            className={`staff-card ${state.selectedEmployee?.id === member.id ? 'selected' : ''}`}
            onClick={() => handleStaffSelect(member)}
          >
            <div className="staff-avatar">
              {member.name.charAt(0)}
            </div>
            <h4>{member.name}</h4>
            <p>{member.title}</p>
          </button>
        ))}
      </div>
      <button 
        className="back-btn"
        onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })}
      >
        Back
      </button>
    </div>
  );
};

export default StaffSelector;