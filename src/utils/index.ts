import { TIME_SLOTS, BUSINESS_HOURS } from '../constants';

// Input sanitization
export const sanitizeInput = (input: string): string => {
    return input.replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
        return entities[char] || char;
    }).trim();
};

export const sanitizeLogInput = (input: string): string => {
    return input.replace(/[\r\n\t]/g, ' ').replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
        return entities[char] || char;
    });
};

// ID generation
export const generateStrongId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const year = new Date().getFullYear();
    return `APT-${year}-${result}`;
};

// Re-export constants for backward compatibility
export const timeSlots = TIME_SLOTS;
export const businessHours = BUSINESS_HOURS;