import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import type {
  MetricsOverviewDTO,
  RevenueBucketDTO,
  KitchenPerformanceDTO,
  WaiterRankingDTO,
  TopMenuItemDTO,
  ApiResponse,
} from '../../../../packages/shared/src/types/index.js';

// Helper to convert BigInt to Number for JSON serialization
function convertBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigInt(obj[key]);
    }
    return result;
  }
  return obj;
}

function parseRange(req: Request) {
  const { start, end, groupBy } = req.query as Record<string, string>;
  const now = new Date();
  let s: Date;
  let e: Date;

  if (start) s = new Date(start);
  else {
    s = new Date(now);
    s.setHours(0, 0, 0, 0);
  }

  if (end) e = new Date(end);
  else e = now;

  return { start: s, end: e, groupBy: groupBy || 'hour' };
}

export class MetricsController {
  // GET /metrics/overview
  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = parseRange(req);

      // Revenue (sum of paidAmount or total when paidAt exists)
      const revenueResult = await prisma.$queryRaw`
        SELECT SUM(COALESCE("paidAmount", total)) AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;

      const revenue = Number((revenueResult as any[])[0]?.revenue ?? 0);

      // Open tabs
      const openTabs = await prisma.tab.count({ where: { status: 'OPEN' } });

      // Tables occupied
      const tablesOccupied = await prisma.table.count({ where: { status: { in: ['OCCUPIED', 'PAID_PENDING_RELEASE'] } } });

      // Ticket médio (period)
      const paidTabs = await prisma.tab.findMany({ where: { paidAt: { gte: start, lte: end } }, select: { paidAmount: true, total: true } });
      const sum = paidTabs.reduce((s: number, t: any) => s + (t.paidAmount ?? t.total ?? 0), 0);
      const ticket = paidTabs.length ? sum / paidTabs.length : 0;

      // Clientes ativos (persons with tab open)
      const activeCustomers = await prisma.person.count({ where: { tab: { status: 'OPEN' } } });

      const payload: ApiResponse<MetricsOverviewDTO> = { success: true, data: { revenue, openTabs, tablesOccupied, ticket, activeCustomers } };
      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  // GET /metrics/revenue?start=&end=&groupBy=hour|day
  async revenue(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, groupBy } = parseRange(req);
      const by = groupBy === 'day' ? "date_trunc('day', \"paidAt\")" : "date_trunc('hour', \"paidAt\")";

      const rows = await prisma.$queryRawUnsafe(
        `SELECT ${by} AS bucket, SUM(COALESCE("paidAmount", total))::double precision AS revenue
         FROM "tabs"
         WHERE "paidAt" IS NOT NULL AND "paidAt" >= $1 AND "paidAt" <= $2
         GROUP BY bucket
         ORDER BY bucket`,
        start,
        end
      );

      res.json({ success: true, data: convertBigInt(rows) as RevenueBucketDTO[] });
    } catch (error) {
      next(error);
    }
  }

  // GET /metrics/kitchen?start=&end=&slaMinutes=12
  async kitchenPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = parseRange(req);
      const sla = Number(req.query.slaMinutes ?? 12) * 60; // seconds

      // average prep (ready - started) in minutes
      const avgRow = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("readyAt" - "startedPreparingAt")))/60 AS avg_prep_minutes
        FROM "orders"
        WHERE "startedPreparingAt" IS NOT NULL
          AND "readyAt" IS NOT NULL
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;

      const avgPrep = (avgRow as any[])[0]?.avg_prep_minutes ?? null;

      // counts by status
      const statusCounts = await prisma.order.groupBy({ by: ['status'], _count: { status: true }, where: { createdAt: { gte: start, lte: end } } });

      // delayed orders
      const delayed = await prisma.$queryRaw`
        SELECT id, "tabId" AS tab_id, "menuItemId" AS menu_item_id, "startedPreparingAt" AS started_preparing_at, status, EXTRACT(EPOCH FROM (now() - "startedPreparingAt")) AS seconds_since_start
        FROM "orders"
        WHERE "startedPreparingAt" IS NOT NULL
          AND status != 'READY'
          AND now() - "startedPreparingAt" > interval '${Math.ceil(sla)} seconds'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;

      const k: KitchenPerformanceDTO = {
        avgPrepMinutes: avgPrep,
        statusCounts: (statusCounts as any[]).map((s: any) => ({ status: s.status as any, count: s._count.status })),
        delayed: (delayed as any[])?.map((d: any) => ({ id: d.id, tabId: d.tab_id, menuItemId: d.menu_item_id, startedPreparingAt: d.started_preparing_at, status: d.status, secondsSinceStart: Number(d.seconds_since_start) })),
      };

      res.json({ success: true, data: k });
    } catch (error) {
      next(error);
    }
  }

  // GET /metrics/waiters/ranking?start=&end=&metric=revenue
  async waitersRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = parseRange(req);

      // Simple approach: join tab_waiter_history with tabs and sum by waiter
      const rows = await prisma.$queryRaw`
        SELECT w.id AS waiter_id, w.name AS waiter_name, SUM(t.total)::double precision AS revenue, COUNT(DISTINCT t."tableId") AS tables_served
        FROM tab_waiter_history h
        JOIN waiters w ON w.id = h."waiterId"
        JOIN "tabs" t ON t.id = h."tabId"
        WHERE t."paidAt" IS NOT NULL AND t."paidAt" >= ${start} AND t."paidAt" <= ${end}
        GROUP BY w.id, w.name
        ORDER BY revenue DESC
        LIMIT 50
      `;

      res.json({ success: true, data: convertBigInt(rows) as WaiterRankingDTO[] });
    } catch (error) {
      next(error);
    }
  }

  // GET /metrics/menu/top-items?start=&end=&limit=10
  async topMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = parseRange(req);
      const limit = Number(req.query.limit ?? 10);

      const rows = await prisma.$queryRaw`
        SELECT mi.id AS menu_item_id, mi.name, SUM(o.quantity) AS qty, SUM(o."totalPrice") AS revenue
        FROM "orders" o
        JOIN "menu_items" mi ON mi.id = o."menuItemId"
        WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name
        ORDER BY qty DESC
        LIMIT ${limit}
      `;

      res.json({ success: true, data: convertBigInt(rows) as TopMenuItemDTO[] });
    } catch (error) {
      next(error);
    }
  }
}

export default new MetricsController();
