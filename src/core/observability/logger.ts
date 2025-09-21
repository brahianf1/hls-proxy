import pinoImport from 'pino';

// This is the robust way to handle dual ESM/CJS packages like pino
const pino = (pinoImport as any).default ?? pinoImport;

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
    },
  },
});
