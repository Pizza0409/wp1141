// 結構化日誌服務
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class Logger {
  private formatLog(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata }),
    };
  }

  private output(entry: LogEntry): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.output(this.formatLog('info', message, metadata));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.output(this.formatLog('warn', message, metadata));
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.output(this.formatLog('error', message, metadata));
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.output(this.formatLog('debug', message, metadata));
    }
  }
}

export default new Logger();


