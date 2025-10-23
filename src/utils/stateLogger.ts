/**
 * State Logger Utility
 * Logs state changes to browser storage and optionally to server
 */

interface LogEntry {
    timestamp: string;
    action: string;
    data: any;
    component?: string;
    userId?: string;
}

class StateLogger {
    private static instance: StateLogger;
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    static getInstance(): StateLogger {
        if (!StateLogger.instance) {
            StateLogger.instance = new StateLogger();
        }
        return StateLogger.instance;
    }

    log(action: string, data: any, component?: string) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            action,
            data: this.sanitizeData(data),
            component,
            userId: this.getCurrentUserId()
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Store in sessionStorage for debug panel
        sessionStorage.setItem('appointease_state_logs', JSON.stringify(this.logs.slice(-100)));
        
        // Console log for development
        console.log(`🔄 [${action}]`, data);
        
        // Send to server if enabled
        this.sendToServer(entry);
    }

    private sanitizeData(data: any): any {
        try {
            return JSON.parse(JSON.stringify(data));
        } catch {
            return String(data);
        }
    }

    private getCurrentUserId(): string {
        return sessionStorage.getItem('appointease_user_id') || 'anonymous';
    }

    private async sendToServer(entry: LogEntry) {
        // Disabled server logging to prevent 404 errors
        // The endpoint /debug/log doesn't exist yet
        return;
    }

    getLogs(): LogEntry[] {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
        sessionStorage.removeItem('appointease_state_logs');
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

export const stateLogger = StateLogger.getInstance();