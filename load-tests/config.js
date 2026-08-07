export const CONFIG = {
  BASE_URL: __ENV.BASE_URL || 'http://127.0.0.1:4173',
  API_URL: __ENV.API_URL || 'http://127.0.0.1:8787',
  THRESHOLDS: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be under 500ms
  },
  STAGES: [
    { duration: '10s', target: 20 },  // Ramp-up up to 20 VUs
    { duration: '20s', target: 50 },  // Ramp up to 50 VUs
    { duration: '10s', target: 0 },   // Ramp-down to 0 VUs
  ],
};
