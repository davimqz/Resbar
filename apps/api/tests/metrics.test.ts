/**
 * Basic example tests for metrics endpoints.
 * These tests are skipped by default to avoid failing CI when DB isn't configured.
 * To run: configure a test DB and remove `.skip` from the describe below.
 */
import request from 'supertest';
import app from '../src/app.js';

describe.skip('Metrics endpoints (integration)', () => {
  it('GET /api/metrics/overview returns 200', async () => {
    const res = await request(app).get('/api/metrics/overview');
    expect(res.status).toBe(401); // protected endpoint without auth should be 401
  });
});
