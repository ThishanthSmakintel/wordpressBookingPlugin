const LOG_FILE = 'appointease-debug.log';

class Logger {
  private static instance: Logger;
  private buffer: string[] = [];
  private flushInterval: number = 2000;

  private constructor() {
    this.startAutoFlush();
    this.interceptConsole();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      this.log('LOG', args);
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.log('ERROR', args);
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.log('WARN', args);
      originalWarn.apply(console, args);
    };
  }

  private log(level: string, args: any[]) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    this.buffer.push(`[${timestamp}] [${level}] ${message}`);
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const logs = this.buffer.join('\n') + '\n';
    this.buffer = [];

    try {
      const response = await fetch('/wp-json/appointease/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
    } catch (e) {
      // Silent fail
    }
  }

  private startAutoFlush() {
    setInterval(() => this.flush(), this.flushInterval);
  }
}

export const initLogger = () => Logger.getInstance();
