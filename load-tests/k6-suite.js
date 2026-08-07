import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

export default function () {
  const webUrl = __ENV.BASE_URL || 'http://localhost:4173/';
  const apiUrl = __ENV.API_URL || 'http://localhost:8787';

  // 1. GET Web App Home Page / Static Assets
  const resHome = http.get(webUrl);
  check(resHome, {
    'Home status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. GET API Health Check
  const resHealth = http.get(`${apiUrl}/api/health`);
  check(resHealth, {
    'API health status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 3. GET Authentication Providers Endpoint
  const resProviders = http.get(`${apiUrl}/api/auth/providers`);
  check(resProviders, {
    'Auth providers status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
