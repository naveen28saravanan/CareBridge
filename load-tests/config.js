export const CONFIG = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:4173',
  THRESHOLDS: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be under 500ms
  },
  STAGES: [
    { duration: '15s', target: 20 },  // Ramp-up up to 20 VUs
    { duration: '30s', target: 100 }, // Ramp-up to 100 VUs
    { duration: '15s', target: 0 },   // Ramp-down to 0 VUs
  ],
};
