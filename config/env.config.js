import path from 'path';

export const config = {
  baseUrl: process.env.TEST_APP_URL || 'http://localhost:4173/CareBridge/',
  browser: process.env.BROWSER || 'chrome',
  headless: process.env.HEADLESS !== 'false',
  implicitWaitMs: 5000,
  explicitWaitMs: 10000,
  pageLoadTimeoutMs: 30000,
  retryCount: process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT, 10) : 1,
  
  reportsDir: path.resolve('reports'),
  screenshotsDir: path.resolve('reports/failures'),
  logsDir: path.resolve('logs'),
  excelDir: path.resolve('excel'),
  
  users: {
    patient: {
      email: 'patient@carebridge.demo',
      password: 'Patient@123',
      name: 'Riya Sharma'
    },
    doctor: {
      email: 'doctor@carebridge.demo',
      password: 'Doctor@123',
      name: 'Dr. Ananya Kumar'
    },
    operations: {
      email: 'admin@carebridge.demo',
      password: 'Admin@123',
      name: 'Operations Admin'
    }
  }
};

export default config;
