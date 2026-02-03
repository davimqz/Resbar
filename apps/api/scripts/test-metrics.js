#!/usr/bin/env node
// Simple test runner for metrics endpoints. Requires Node 18+ (global fetch).

const BASE = process.env.BASE_URL || 'http://localhost:3333';
const TOKEN = process.env.TOKEN || '';

const headers = { 'Content-Type': 'application/json' };
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

const endpoints = [
  { path: '/api/metrics/overview', name: 'Overview' },
  { path: '/api/metrics/revenue?groupBy=hour', name: 'Revenue (hour)' },
  { path: '/api/metrics/kitchen?slaMinutes=12', name: 'Kitchen performance' },
  { path: '/api/metrics/waiters/ranking', name: 'Waiters ranking' },
  { path: '/api/metrics/menu/top-items?limit=5', name: 'Top menu items' },
];

async function call(ep) {
  const url = `${BASE}${ep.path}`;
  try {
    const res = await fetch(url, { headers });
    const json = await res.json().catch(() => null);
    console.log('---', ep.name, '---');
    console.log('HTTP', res.status);
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error calling', url, err.message || err);
  }
}

async function run() {
  console.log('Base:', BASE);
  for (const ep of endpoints) {
    await call(ep);
  }
}

run();
