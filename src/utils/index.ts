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

// Time slots
export const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

// Business hours
export const businessHours = { start: '09:00', end: '17:00', closedDays: [0, 6] };