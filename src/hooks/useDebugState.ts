import { useState, useEffect } from 'react';
import { Service } from '../types';

// Check if user is super admin
const isSuperAdmin = () => {
    return localStorage.getItem('appointease_debug_mode') === 'true' || 
           window.location.search.includes('debug=true') ||
           document.body.classList.contains('wp-admin');
};

export const useDebugState = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [timeSynced, setTimeSynced] = useState(false);
    const [showDebug, setShowDebug] = useState(true);
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [debugServices, setDebugServices] = useState<Service[]>([]);
    const [debugStaff, setDebugStaff] = useState<any[]>([]);
    const [workingDays, setWorkingDays] = useState<string[]>([]);
    const [debugTimeSlots, setDebugTimeSlots] = useState<string[]>([]);
    const [availabilityData, setAvailabilityData] = useState<any>(null);
    const [activeSelections, setActiveSelections] = useState<any[]>([]);
    const [lockedSlots, setLockedSlots] = useState<any[]>([]);

    // Enable debug mode with keyboard shortcut
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                const newDebugState = !showDebug;
                setShowDebug(newDebugState);
                localStorage.setItem('appointease_debug_mode', newDebugState.toString());
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showDebug]);

    return {
        currentTime, setCurrentTime,
        timeZone, setTimeZone,
        timeSynced, setTimeSynced,
        showDebug, setShowDebug,
        allBookings, setAllBookings,
        debugServices, setDebugServices,
        debugStaff, setDebugStaff,
        workingDays, setWorkingDays,
        debugTimeSlots, setDebugTimeSlots,
        availabilityData, setAvailabilityData,
        activeSelections, setActiveSelections,
        lockedSlots, setLockedSlots
    };
};