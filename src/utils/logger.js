class Logger {
  get timestamp() {
    return new Date().toISOString();
  }

  info(...args) {
    console.log(`[LOG] [${this.timestamp}]`, ...args);
  }

  error(...args) {
    console.error(`[ERROR] [${this.timestamp}]`, ...args);
  }
}

export const logger = new Logger();
