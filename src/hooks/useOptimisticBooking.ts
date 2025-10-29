/**
 * Optimistic Booking Hook - Industry Standard
 * Implements Calendly-style optimistic locking with real-time conflict detection
 */

import { useState, useCallback, useRef } from 'react';
import { useRealtime } from './useRealtime';

interface OptimisticBookingState {
  isBooking: boolean;
  conflicts: string[];
  suggestedSlots: string[];
  lastConflictTime: number;
}

export const useOptimisticBooking = (selectedDate: string, selectedEmployee: any) => {
  const [state, setState] = useState<OptimisticBookingState>({
    isBooking: false,
    conflicts: [],
    suggestedSlots: [],
    lastConflictTime: 0
  });
  
  const watchingSlotRef = useRef<{date: string, time: string, employeeId: number} | null>(null);
  
  // Real-time conflict detection
  const handleSlotConflict = useCallback((data: any) => {
    if (data.type === 'slot_taken') {
      const conflictTime = data.time;
      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflictTime],
        lastConflictTime: Date.now()
      }));
      
      // Show user notification
      if (window.Toastify) {
        window.Toastify({
          text: `⚠️ Time slot ${conflictTime} was just booked by another user`,
          duration: 5000,
          backgroundColor: '#f59e0b',
          className: 'booking-conflict-toast'
        }).showToast();
      }
    }
  }, []);
  
  /**
   * Watch specific time slot for conflicts (Calendly pattern)
   */
  const watchSlot = useCallback((time: string, send: Function) => {
    if (!selectedDate || !selectedEmployee || !time) return;
    
    const slotData = {
      date: selectedDate,
      time: time,
      employeeId: selectedEmployee.id
    };
    
    // Only watch if slot changed
    if (watchingSlotRef.current?.time !== time) {
      watchingSlotRef.current = slotData;
      send('watch_slot', slotData);
      //console.log('[OptimisticBooking] Watching slot:', slotData);
    }
  }, [selectedDate, selectedEmployee]);
  
  /**
   * Optimistic time selection - validation handled by availability endpoint
   */
  const selectTimeOptimistically = useCallback(async (time: string, onTimeSelect: Function) => {
    // Optimistically select time (immediate UI update)
    onTimeSelect(time);
    // Validation happens via availability endpoint which already checks locks
    console.log('[OptimisticBooking] Time selected:', time);
  }, []);
  
  /**
   * Atomic booking submission with conflict prevention
   */
  const submitBookingAtomically = useCallback(async (bookingData: any) => {
    setState(prev => ({ ...prev, isBooking: true }));
    
    try {
      // Generate idempotency key for duplicate prevention
      const idempotencyKey = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch(`${window.bookingAPI?.root}appointease/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          'X-WP-Nonce': window.bookingAPI?.nonce
        },
        body: JSON.stringify({
          ...bookingData,
          idempotency_key: idempotencyKey
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.code === 'slot_taken') {
          // Handle real-time conflict with suggested alternatives
          setState(prev => ({
            ...prev,
            conflicts: [...prev.conflicts, bookingData.time],
            suggestedSlots: result.data?.suggested_slots || [],
            lastConflictTime: Date.now()
          }));
          
          // Show conflict notification
          if (window.Toastify) {
            window.Toastify({
              text: `⚠️ Time slot ${bookingData.time} was just taken. Try suggested alternatives.`,
              duration: 8000,
              backgroundColor: '#e74c3c',
              className: 'booking-conflict-toast'
            }).showToast();
          }
        }
        throw new Error(result.message || 'Booking failed');
      }
      
      // Clear conflicts on successful booking
      setState(prev => ({
        ...prev,
        conflicts: [],
        suggestedSlots: []
      }));
      
      return result;
      
    } catch (error) {
      console.error('[OptimisticBooking] Atomic submission failed:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isBooking: false }));
    }
  }, []);
  
  /**
   * Clear conflicts
   */
  const clearConflicts = useCallback(() => {
    setState(prev => ({ ...prev, conflicts: [], suggestedSlots: [] }));
  }, []);
  
  return {
    ...state,
    watchSlot,
    selectTimeOptimistically,
    submitBookingAtomically,
    clearConflicts,
    handleSlotConflict
  };
};