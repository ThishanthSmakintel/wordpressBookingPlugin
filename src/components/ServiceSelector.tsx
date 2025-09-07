import React, { useEffect } from 'react';
import { useBooking } from '../contexts/BookingContext';
import { useAPI } from '../hooks/useAPI';

const ServiceSelector: React.FC = () => {
  const { state, dispatch } = useBooking();
  const { data: services, loading: servicesLoading, request } = useAPI<any[]>();

  useEffect(() => {
    request('appointease/v1/services');
  }, [request]);

  const handleServiceSelect = (service: any) => {
    dispatch({ type: 'SET_SERVICE', payload: service });
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  if (servicesLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading services...</p>
    </div>
  );

  return (
    <div className="service-selector">
      <h3>Select a Service</h3>
      <div className="services-grid">
        {services?.map(service => (
          <button
            key={service.id}
            className={`service-card ${state.selectedService?.id === service.id ? 'selected' : ''}`}
            onClick={() => handleServiceSelect(service)}
          >
            <h4>{service.name}</h4>
            <p>{service.duration} min</p>
            <span className="price">${service.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelector;