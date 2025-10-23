import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from 'react';

export const useDebugStore = () => {
    const state = useSelect((select: any) => {
        const store = select('appointease/booking');
        return {
            showDebug: store.getShowDebug?.() ?? false,
            allBookings: store.getAllBookings?.() ?? [],
            debugServices: store.getDebugServices?.() ?? [],
            debugStaff: store.getDebugStaff?.() ?? [],
            workingDays: store.getWorkingDays?.() ?? ['1', '2', '3', '4', '5'],
            debugTimeSlots: store.getDebugTimeSlots?.() ?? [],
            availabilityData: store.getAvailabilityData?.() ?? null,
            currentTime: store.getCurrentTime?.() ?? new Date(),
            timeSynced: store.getTimeSynced?.() ?? false,
            connectionMode: store.getConnectionMode?.() ?? 'disconnected'
        };
    }, []);

    const dispatch = useDispatch('appointease/booking');

    return {
        ...state,
        setShowDebug: useCallback((show: boolean) => dispatch?.setShowDebug?.(show), [dispatch]),
        setAllBookings: useCallback((bookings: any[]) => dispatch?.setAllBookings?.(bookings), [dispatch]),
        setDebugServices: useCallback((services: any[]) => dispatch?.setDebugServices?.(services), [dispatch]),
        setDebugStaff: useCallback((staff: any[]) => dispatch?.setDebugStaff?.(staff), [dispatch]),
        setWorkingDays: useCallback((days: string[]) => dispatch?.setWorkingDays?.(days), [dispatch]),
        setDebugTimeSlots: useCallback((slots: any[]) => dispatch?.setDebugTimeSlots?.(slots), [dispatch]),
        setAvailabilityData: useCallback((data: any) => dispatch?.setAvailabilityData?.(data), [dispatch]),
        setCurrentTime: useCallback((time: Date) => dispatch?.setCurrentTime?.(time), [dispatch]),
        setTimeSynced: useCallback((synced: boolean) => dispatch?.setTimeSynced?.(synced), [dispatch]),
        setConnectionMode: useCallback((mode: string) => dispatch?.setConnectionMode?.(mode), [dispatch])
    };
};
