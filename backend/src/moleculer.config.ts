import { BrokerOptions } from 'moleculer';
import * as dotenv from 'dotenv';

dotenv.config();

const brokerConfig: BrokerOptions = {
  namespace: 'notes-service',
  nodeID: process.env.NODE_ID || undefined,

  logger:
    process.env.NODE_ENV === 'production'
      ? {
          type: 'File',
          options: {
            level: process.env.LOG_LEVEL || 'info',
            folder: process.env.LOG_FOLDER || './logs',
            filename: process.env.LOG_FILENAME || 'notes-service-{date}.log',
            formatter: 'json',
            eol: '\n',
            interval: 1000,
          },
        }
      : {
          type: 'Console',
          options: {
            level: process.env.LOG_LEVEL || 'info',
            colors: true,
            moduleColors: true,
            formatter: 'full',
            autoPadding: true,
          },
        },

  transporter: process.env.TRANSPORTER || undefined,

  requestTimeout: 10 * 1000,

  retryPolicy: {
    enabled: false,
    retries: 5,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: (err: Error) => err && !!err.message,
  },

  maxCallLevel: 100,

  heartbeatInterval: 10,
  heartbeatTimeout: 30,

  tracking: {
    enabled: false,
    shutdownTimeout: 5000,
  },

  disableBalancer: false,

  registry: {
    strategy: 'RoundRobin',
    preferLocal: true,
  },

  circuitBreaker: {
    enabled: false,
    threshold: 0.5,
    minRequestCount: 20,
    windowTime: 60,
    halfOpenTime: 10 * 1000,
    check: (err: Error) => err && err.message !== '',
  },

  bulkhead: {
    enabled: false,
    concurrency: 10,
    maxQueueSize: 100,
  },

  validator: true,

  metrics: {
    enabled: false,
  },

  tracing: {
    enabled: false,
  },

  cacher: false,

  serializer: 'JSON',

  replCommands: null,

  skipProcessEventRegistration: false,

  created(broker) {
    // Lifecycle hook
  },

  started(broker) {
    // Lifecycle hook
  },

  stopped(broker) {
    // Lifecycle hook
  },
};

export default brokerConfig;
