import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export function getRandomUser() {
  return {
    email: `test_vu_${randomString(6)}@carebridge.demo`,
    password: `Pass_${randomString(8)}!`,
    name: `User_${randomString(5)}`
  };
}

export function getHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
