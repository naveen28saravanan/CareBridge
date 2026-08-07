import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from './config.js';
import { getRandomUser, getHeaders } from './helpers.js';

export const options = {
  stages: CONFIG.STAGES,
  thresholds: CONFIG.THRESHOLDS,
};

export default function () {
  const baseUrl = CONFIG.BASE_URL;

  // 1. GET Homepage / Main Bundle
  const resHome = http.get(baseUrl);
  check(resHome, {
    'Home status is 200': (r) => r.status === 200,
    'Home load time < 800ms': (r) => r.timings.duration < 800,
  });
  sleep(1);

  // 2. Authentication API (Simulated POST /api/login)
  const userPayload = JSON.stringify(getRandomUser());
  const resLogin = http.post(`${baseUrl}`, userPayload, { headers: getHeaders() });
  check(resLogin, {
    'Login request processed': (r) => r.status === 200 || r.status === 304,
  });
  sleep(1);

  // 3. User Data Endpoint Simulation
  const resUsers = http.get(`${baseUrl}`, { headers: getHeaders('demo-token-123') });
  check(resUsers, {
    'GET users status 200': (r) => r.status === 200,
  });
  sleep(1);
}
