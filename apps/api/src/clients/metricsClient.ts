import type { ApiResponse } from '@resbar/shared';
import type { components } from '../../../../packages/shared/src/openapi/metrics-api';

type MetricsOverview = components['schemas']['MetricsOverview'];
type RevenueBucket = components['schemas']['RevenueBucket'];
type KitchenPerformance = components['schemas']['KitchenPerformance'];
type WaiterRankingItem = components['schemas']['WaiterRankingItem'];
type TopMenuItem = components['schemas']['TopMenuItem'];

const defaultBase = process.env.METRICS_API_BASE || 'http://localhost:3333';

function buildUrl(path: string) {
  return `${defaultBase}${path}`;
}

async function request<T>(path: string, token?: string): Promise<ApiResponse<T>> {
  const res = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json().catch(() => ({ success: false, error: 'Invalid JSON' }));
  return json as ApiResponse<T>;
}

export async function overview(token?: string) {
  return request<MetricsOverview>('/api/metrics/overview', token);
}

export async function revenue(start?: string, end?: string, groupBy: 'hour' | 'day' = 'hour', token?: string) {
  const qs = new URLSearchParams();
  if (start) qs.set('start', start);
  if (end) qs.set('end', end);
  qs.set('groupBy', groupBy);
  return request<RevenueBucket[]>(`/api/metrics/revenue?${qs.toString()}`, token);
}

export async function kitchenPerformance(start?: string, end?: string, slaMinutes = 12, token?: string) {
  const qs = new URLSearchParams();
  if (start) qs.set('start', start);
  if (end) qs.set('end', end);
  qs.set('slaMinutes', String(slaMinutes));
  return request<KitchenPerformance>(`/api/metrics/kitchen?${qs.toString()}`, token);
}

export async function waitersRanking(start?: string, end?: string, token?: string) {
  const qs = new URLSearchParams();
  if (start) qs.set('start', start);
  if (end) qs.set('end', end);
  return request<WaiterRankingItem[]>(`/api/metrics/waiters/ranking?${qs.toString()}`, token);
}

export async function topMenuItems(start?: string, end?: string, limit = 10, token?: string) {
  const qs = new URLSearchParams();
  if (start) qs.set('start', start);
  if (end) qs.set('end', end);
  qs.set('limit', String(limit));
  return request<TopMenuItem[]>(`/api/metrics/menu/top-items?${qs.toString()}`, token);
}

export default {
  overview,
  revenue,
  kitchenPerformance,
  waitersRanking,
  topMenuItems,
};
