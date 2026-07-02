// Production-grade custom structured JSON logger
export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        ...meta,
      })
    );
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ...meta,
      })
    );
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        ...meta,
      })
    );
  },
};
