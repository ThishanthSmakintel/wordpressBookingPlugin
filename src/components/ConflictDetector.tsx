/**
 * Conflict Detector Component
 * Real-time booking conflict detection and user notifications
 */

import React, { useEffect, useState } from 'react';
import { useRealtimeConflicts } from '../hooks/useRealtimeConflicts';
import { useOptimisticBooking } from '../hooks/useOptimisticBooking';

interface ConflictDetectorProps {
  selectedDate: string;
  selectedTime: string;
  selectedEmployee: any;
  onConflictDetected?: (conflictData: any) => void;
  onSuggestedSlots?: (slots: string[]) => void;
}

export const ConflictDetector: React.FC<ConflictDetectorProps> = ({
  selectedDate,
  selectedTime,
  selectedEmployee,
  onConflictDetected,
  onSuggestedSlots
}) => {
  const [isActive, setIsActive] = useState(false);
  
  // Watch current slot for conflicts
  const watchedSlots = selectedDate && selectedTime && selectedEmployee ? [{
    date: selectedDate,
    time: selectedTime,
    employeeId: selectedEmployee.id
  }] : [];
  
  const {
    isConnected,
    connectionMode,
    conflicts,
    watchSlot,
    clearConflicts
  } = useRealtimeConflicts(watchedSlots);
  
  const {
    conflicts: optimisticConflicts,
    suggestedSlots,
    handleSlotConflict
  } = useOptimisticBooking(selectedDate, selectedEmployee);
  
  // Handle real-time conflicts
  useEffect(() => {
    const latestConflict = conflicts[conflicts.length - 1];
    
    if (latestConflict && 
        latestConflict.date === selectedDate && 
        latestConflict.time === selectedTime &&
        latestConflict.employee_id === selectedEmployee?.id) {
      
      console.warn('[ConflictDetector] Real-time conflict detected:', latestConflict);
      
      // Notify parent component
      if (onConflictDetected) {
        onConflictDetected(latestConflict);
      }
      
      // Handle optimistic booking conflict
      handleSlotConflict(latestConflict);
    }
  }, [conflicts, selectedDate, selectedTime, selectedEmployee, onConflictDetected, handleSlotConflict]);
  
  // Handle suggested slots
  useEffect(() => {
    if (suggestedSlots.length > 0 && onSuggestedSlots) {
      onSuggestedSlots(suggestedSlots);
    }
  }, [suggestedSlots, onSuggestedSlots]);
  
  // Listen for custom conflict events
  useEffect(() => {
    const handleCustomConflict = (event: CustomEvent) => {
      const conflictData = event.detail;
      console.log('[ConflictDetector] Custom conflict event:', conflictData);
      
      if (onConflictDetected) {
        onConflictDetected(conflictData);
      }
    };
    
    window.addEventListener('appointease:slot_conflict', handleCustomConflict as EventListener);
    
    return () => {
      window.removeEventListener('appointease:slot_conflict', handleCustomConflict as EventListener);
    };
  }, [onConflictDetected]);
  
  // Activate/deactivate based on slot selection
  useEffect(() => {
    const shouldBeActive = !!(selectedDate && selectedTime && selectedEmployee);
    
    if (shouldBeActive !== isActive) {\n      setIsActive(shouldBeActive);\n      \n      if (shouldBeActive) {\n        console.log('[ConflictDetector] Activating conflict detection for:', {\n          date: selectedDate,\n          time: selectedTime,\n          employee: selectedEmployee?.name\n        });\n        \n        // Start watching the slot\n        watchSlot(selectedDate, selectedTime, selectedEmployee.id);\n      } else {\n        console.log('[ConflictDetector] Deactivating conflict detection');\n        clearConflicts();\n      }\n    }\n  }, [selectedDate, selectedTime, selectedEmployee, isActive, watchSlot, clearConflicts]);\n  \n  // Don't render anything if not active\n  if (!isActive) {\n    return null;\n  }\n  \n  return (\n    <div className=\"conflict-detector\">\n      {/* Connection Status Indicator */}\n      <div className={`connection-status connection-${connectionMode}`}>\n        <span className=\"status-indicator\"></span>\n        <span className=\"status-text\">\n          {isConnected ? (\n            connectionMode === 'websocket' ? 'Real-time active' : 'Polling active'\n          ) : (\n            'Checking availability...'\n          )}\n        </span>\n      </div>\n      \n      {/* Conflict Notifications */}\n      {(conflicts.length > 0 || optimisticConflicts.length > 0) && (\n        <div className=\"conflict-notifications\">\n          <div className=\"conflict-alert\">\n            <span className=\"conflict-icon\">⚠️</span>\n            <span className=\"conflict-message\">\n              Time slot conflicts detected. Please select an alternative time.\n            </span>\n          </div>\n          \n          {/* Suggested Alternative Slots */}\n          {suggestedSlots.length > 0 && (\n            <div className=\"suggested-slots\">\n              <p className=\"suggested-title\">Suggested available times:</p>\n              <div className=\"suggested-times\">\n                {suggestedSlots.map((slot, index) => (\n                  <button\n                    key={index}\n                    className=\"suggested-time-btn\"\n                    onClick={() => {\n                      // This would trigger time selection in parent component\n                      window.dispatchEvent(new CustomEvent('appointease:select_suggested_time', {\n                        detail: { time: slot }\n                      }));\n                    }}\n                  >\n                    {slot}\n                  </button>\n                ))}\n              </div>\n            </div>\n          )}\n        </div>\n      )}\n      \n      <style jsx>{`\n        .conflict-detector {\n          margin: 10px 0;\n        }\n        \n        .connection-status {\n          display: flex;\n          align-items: center;\n          gap: 8px;\n          font-size: 12px;\n          color: #666;\n          margin-bottom: 10px;\n        }\n        \n        .status-indicator {\n          width: 8px;\n          height: 8px;\n          border-radius: 50%;\n          background: #ccc;\n        }\n        \n        .connection-websocket .status-indicator {\n          background: #2ecc71;\n          animation: pulse 2s infinite;\n        }\n        \n        .connection-polling .status-indicator {\n          background: #f39c12;\n        }\n        \n        .connection-disconnected .status-indicator {\n          background: #e74c3c;\n        }\n        \n        @keyframes pulse {\n          0% { opacity: 1; }\n          50% { opacity: 0.5; }\n          100% { opacity: 1; }\n        }\n        \n        .conflict-notifications {\n          background: #fff3cd;\n          border: 1px solid #ffeaa7;\n          border-radius: 6px;\n          padding: 12px;\n          margin: 10px 0;\n        }\n        \n        .conflict-alert {\n          display: flex;\n          align-items: center;\n          gap: 8px;\n          color: #856404;\n          font-weight: 500;\n          margin-bottom: 10px;\n        }\n        \n        .conflict-icon {\n          font-size: 16px;\n        }\n        \n        .suggested-slots {\n          margin-top: 10px;\n        }\n        \n        .suggested-title {\n          font-size: 14px;\n          font-weight: 500;\n          color: #856404;\n          margin: 0 0 8px 0;\n        }\n        \n        .suggested-times {\n          display: flex;\n          gap: 8px;\n          flex-wrap: wrap;\n        }\n        \n        .suggested-time-btn {\n          background: #fff;\n          border: 1px solid #ddd;\n          border-radius: 4px;\n          padding: 6px 12px;\n          font-size: 12px;\n          cursor: pointer;\n          transition: all 0.2s;\n        }\n        \n        .suggested-time-btn:hover {\n          background: #f8f9fa;\n          border-color: #007cba;\n          color: #007cba;\n        }\n      `}</style>\n    </div>\n  );\n};