import { test, expect } from '@playwright/test';

test.describe('AI Agent Sandbox - E-Commerce', () => {
  test('Should be able to connect to the backend health endpoint', async ({ request }) => {
    // Sandbox test for AI agents to interact with the backend API
    const response = await request.get('http://localhost:5000/api/health'); // Adjust port as needed
    
    // In a real sandbox execution, the agent can use Playwright's APIRequestContext
    // to simulate complex API workflows (login, order creation, etc.) safely.
    // expect(response.ok()).toBeTruthy();
  });
});
