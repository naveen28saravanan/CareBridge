import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from './config.js';

export const options = {
  stages: CONFIG.STAGES,
  thresholds: CONFIG.THRESHOLDS,
};

export default function () {
  const webUrl = CONFIG.BASE_URL;
  const apiUrl = CONFIG.API_URL;

  // 1. GET Web App Home Page / Static Assets
  const resHome = http.get(webUrl);
  check(resHome, {
    'Home status is 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // 2. GET API Health Check
  const resHealth = http.get(`${apiUrl}/api/health`);
  check(resHealth, {
    'API health status is 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // 3. GET Authentication Providers Endpoint
  const resProviders = http.get(`${apiUrl}/api/auth/providers`);
  check(resProviders, {
    'Auth providers status is 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
