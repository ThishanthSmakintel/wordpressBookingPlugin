import { useState } from 'react';
import { Service } from '../types';

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
        availabilityData, setAvailabilityData
    };
};