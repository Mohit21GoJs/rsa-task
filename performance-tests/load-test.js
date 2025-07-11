import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Hold at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Hold at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test scenarios
  let scenarios = [
    testHomePage,
    testAPIHealth,
    testApplicationsList,
    testCreateApplication,
  ];

  // Run a random scenario
  let scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(1); // Wait 1 second between iterations
}

function testHomePage() {
  let response = http.get(`${BASE_URL}/`);
  
  check(response, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads in reasonable time': (r) => r.timings.duration < 1000,
    'Homepage contains expected content': (r) => r.body.includes('Job Application'),
  }) || errorRate.add(1);
}

function testAPIHealth() {
  let response = http.get(`${BASE_URL}/api/health`);
  
  check(response, {
    'Health check status is 200': (r) => r.status === 200,
    'Health check responds quickly': (r) => r.timings.duration < 200,
    'Health check returns JSON': (r) => r.headers['Content-Type'].includes('application/json'),
  }) || errorRate.add(1);
}

function testApplicationsList() {
  let response = http.get(`${BASE_URL}/api/applications`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  check(response, {
    'Applications list status is 200': (r) => r.status === 200,
    'Applications list responds in time': (r) => r.timings.duration < 1000,
    'Applications list returns array': (r) => {
      try {
        let data = JSON.parse(r.body);
        return Array.isArray(data) || Array.isArray(data.data);
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testCreateApplication() {
  let payload = JSON.stringify({
    company: `Test Company ${Math.floor(Math.random() * 1000)}`,
    position: 'Software Engineer',
    status: 'applied',
    description: 'Load test application',
  });

  let params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  let response = http.post(`${BASE_URL}/api/applications`, payload, params);
  
  check(response, {
    'Create application status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'Create application responds in time': (r) => r.timings.duration < 2000,
    'Create application returns valid response': (r) => {
      try {
        let data = JSON.parse(r.body);
        return data.id !== undefined || data.company !== undefined;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

// Setup function - runs once at the beginning
export function setup() {
  console.log(`Starting performance test against ${BASE_URL}`);
  
  // Verify the application is running
  let response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Application not responding at ${BASE_URL}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('Performance test completed');
} 