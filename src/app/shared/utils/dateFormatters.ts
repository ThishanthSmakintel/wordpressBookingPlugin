export const formatAppointmentDateTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dateFormatted = date.toLocaleDateString('en', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeFormatted = date.toLocaleTimeString('en', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  return `${dateFormatted} at ${timeFormatted}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatTime = (timeString: string) => {
  return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};