import React from 'react';

interface TimeWidgetProps {
  currentTime: Date;
  timeZone: string;
}

export const TimeWidget: React.FC<TimeWidgetProps> = ({ currentTime, timeZone }) => {
  return (
    <div className="time-widget">
      <div className="current-time">
        {currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
      <div className="timezone">
        {timeZone}
      </div>
    </div>
  );
};