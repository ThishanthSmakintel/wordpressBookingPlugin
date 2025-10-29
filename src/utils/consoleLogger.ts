/**
 * Console Logger - Captures all console logs and saves to file
 */

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  browser: string;
  url: string;
}

class ConsoleLogger {
  private logs: LogEntry[] = [];
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  constructor() {
    this.interceptConsole();
    this.autoSave();
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private interceptConsole() {
    const self = this;
    
    console.log = function(...args: any[]) {
      self.addLog('log', args);
      self.originalConsole.log.apply(console, args);
    };

    console.error = function(...args: any[]) {
      self.addLog('error', args);
      self.originalConsole.error.apply(console, args);
    };

    console.warn = function(...args: any[]) {
      self.addLog('warn', args);
      self.originalConsole.warn.apply(console, args);
    };

    console.info = function(...args: any[]) {
      self.addLog('info', args);
      self.originalConsole.info.apply(console, args);
    };
  }

  private addLog(type: string, args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    this.logs.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      browser: this.getBrowserInfo(),
      url: window.location.href
    });

    // Keep only last 500 logs
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }
  }

  private async autoSave() {
    setInterval(async () => {
      if (this.logs.length > 0) {
        await this.saveLogs();
      }
    }, 10000); // Save every 10 seconds
  }

  private async saveLogs() {
    try {
      const response = await fetch(`${(window as any).bookingAPI?.root}appointease/v1/save-browser-logs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ logs: this.logs })
      });
      
      if (response.ok) {
        this.logs = []; // Clear after successful save
      }
    } catch (e) {
      // Silent fail
    }
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  new ConsoleLogger();
}

export default ConsoleLogger;
