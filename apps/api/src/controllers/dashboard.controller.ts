import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import type { DashboardStatsDTO } from '@resbar/shared';

export class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Revenue do dia (comandas fechadas hoje)
      const dailyRevenueTabs = await prisma.tab.findMany({
        where: {
          status: 'CLOSED',
          closedAt: {
            gte: today,
          },
        },
        select: {
          total: true,
        },
      });

      const dailyRevenue = dailyRevenueTabs.reduce((sum, tab) => sum + tab.total, 0);

      // Contagem de pedidos por status
      const orderCounts = await prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      const ordersCount = {
        pending: orderCounts.find(o => o.status === 'PENDING')?._count.status || 0,
        preparing: orderCounts.find(o => o.status === 'PREPARING')?._count.status || 0,
        ready: orderCounts.find(o => o.status === 'READY')?._count.status || 0,
        delivered: orderCounts.find(o => o.status === 'DELIVERED')?._count.status || 0,
      };

      // Mesas ocupadas
      const tablesOccupied = await prisma.table.count({
        where: {
          status: {
            in: ['OCCUPIED', 'PAID_PENDING_RELEASE'],
          },
        },
      });

      // Itens mais vendidos (hoje)
      const popularItemsData = await prisma.order.groupBy({
        by: ['menuItemId'],
        where: {
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      const menuItemIds = popularItemsData.map(item => item.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
        },
      });

      const popularItems = popularItemsData.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        return {
          itemId: item.menuItemId,
          itemName: menuItem?.name || 'Item desconhecido',
          totalSold: item._sum.quantity || 0,
          revenue: item._sum.totalPrice || 0,
        };
      });

      // Performance dos garçons (hoje)
      const waiterStats = await prisma.tab.groupBy({
        by: ['tableId'],
        where: {
          status: 'CLOSED',
          closedAt: {
            gte: today,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      });

      const tableIds = waiterStats.map(stat => stat.tableId).filter(Boolean) as string[];
      const tables = await prisma.table.findMany({
        where: {
          id: {
            in: tableIds,
          },
        },
        include: {
          waiter: true,
        },
      });

      const waiterPerformanceMap = new Map<string, { name: string; tablesServed: number; totalRevenue: number }>();

      waiterStats.forEach(stat => {
        const table = tables.find(t => t.id === stat.tableId);
        if (table && table.waiter) {
          const existing = waiterPerformanceMap.get(table.waiterId!) || {
            name: table.waiter.name,
            tablesServed: 0,
            totalRevenue: 0,
          };

          waiterPerformanceMap.set(table.waiterId!, {
            name: existing.name,
            tablesServed: existing.tablesServed + stat._count.id,
            totalRevenue: existing.totalRevenue + (stat._sum.total || 0),
          });
        }
      });

      const waiterPerformance = Array.from(waiterPerformanceMap.entries()).map(([waiterId, data]) => ({
        waiterId,
        waiterName: data.name,
        tablesServed: data.tablesServed,
        totalRevenue: data.totalRevenue,
      }));

      // Currently clocked-in waiters
      const activeWaiters = await prisma.waiter.findMany({
        where: {
          clockedInAt: { not: null },
          clockedOutAt: null,
        },
        select: {
          id: true,
          name: true,
          active: true,
          onBreak: true,
          breakStartedAt: true,
          clockedInAt: true,
          clockedOutAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const counterTabs = await prisma.tab.count({
        where: {
          type: 'COUNTER',
          createdAt: {
            gte: today,
          },
        },
      });

      const stats: DashboardStatsDTO = {
        dailyRevenue,
        ordersCount,
        tablesOccupied,
        counterTabs,
        popularItems,
        waiterPerformance,
        activeWaiters,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/finance/summary?start=...&end=...
  async getFinanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // Total revenue (paid tabs)
      const revenueResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;

      const revenue = Number((revenueResult as any[])[0]?.revenue ?? 0);

      // Count of transactions (paid tabs)
      const transactionsCount = await prisma.tab.count({ where: { paidAt: { gte: start, lte: end } } });

      const avgTicket = transactionsCount ? revenue / transactionsCount : 0;

      // Revenue by payment method
      const revenueByPaymentRows = await prisma.$queryRaw`
        SELECT "paymentMethod", ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
        GROUP BY "paymentMethod"
      `;

      const revenueByPayment = (revenueByPaymentRows as any[]).map(r => ({ method: r.paymentMethod, revenue: Number(r.revenue) }));

      // Top menu items in period
      const topItemsRows = await prisma.$queryRaw`
        SELECT mi.id AS menu_item_id, mi.name, SUM(o.quantity) AS qty, ROUND(SUM(o."totalPrice")::numeric, 2)::double precision AS revenue
        FROM "orders" o
        JOIN "menu_items" mi ON mi.id = o."menuItemId"
        JOIN "tabs" t ON t.id = o."tabId"
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
        GROUP BY mi.id, mi.name
        ORDER BY qty DESC
        LIMIT 5
      `;

      const topItems = (topItemsRows as any[]).map(r => ({ itemId: r.menu_item_id, name: r.name, qty: Number(r.qty), revenue: Number(r.revenue) }));

      res.json({ success: true, data: { revenue, transactionsCount, avgTicket, revenueByPayment, topItems } });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/overview?start=...&end=...
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // Revenue buckets: today, last 7 days, last 30 days
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
      const last7Start = new Date(now); last7Start.setDate(last7Start.getDate() - 6); last7Start.setHours(0,0,0,0);
      const last30Start = new Date(now); last30Start.setDate(last30Start.getDate() - 29); last30Start.setHours(0,0,0,0);

      const q = (s: Date) => prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${s}
          AND "paidAt" <= ${now}
      `;

      const [todayRes, last7Res, last30Res] = await Promise.all([q(todayStart), q(last7Start), q(last30Start)]);
      const revenueToday = Number((todayRes as any[])[0]?.revenue ?? 0);
      const revenue7d = Number((last7Res as any[])[0]?.revenue ?? 0);
      const revenue30d = Number((last30Res as any[])[0]?.revenue ?? 0);

      // Orders count by status (since start param or today)
      const ordersGroup = await prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end },
        },
        _count: { status: true },
      });

      const ordersCount = {
        pending: ordersGroup.find(o => o.status === 'PENDING')?._count.status || 0,
        preparing: ordersGroup.find(o => o.status === 'PREPARING')?._count.status || 0,
        ready: ordersGroup.find(o => o.status === 'READY')?._count.status || 0,
        delivered: ordersGroup.find(o => o.status === 'DELIVERED')?._count.status || 0,
      };

      // Avg ticket (use paid tabs in range)
      const paidTabsCount = await prisma.tab.count({ where: { paidAt: { gte: start, lte: end } } });
      const paidTabsRevenueRes = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const paidRevenue = Number((paidTabsRevenueRes as any[])[0]?.revenue ?? 0);
      const avgTicket = paidTabsCount ? paidRevenue / paidTabsCount : 0;

      // Tables occupied / occupancy rate
      const tablesOccupied = await prisma.table.count({ where: { status: { in: ['OCCUPIED', 'PAID_PENDING_RELEASE'] } } });
      const totalTables = await prisma.table.count();
      const occupancyRate = totalTables ? (tablesOccupied / totalTables) * 100 : 0;

      // Clients active / open tabs
      const openTabs = await prisma.tab.count({ where: { status: 'OPEN' } });

      // Time-series revenue (daily buckets between start and end)
      const timeseriesRows = await prisma.$queryRaw`
        SELECT date_trunc('day', "paidAt")::date AS day, ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
        GROUP BY day
        ORDER BY day
      `;

      const revenueSeries = (timeseriesRows as any[]).map(r => ({ day: r.day, revenue: Number(r.revenue) }));

      res.json({
        success: true,
        data: {
          revenue: { today: revenueToday, last7d: revenue7d, last30d: revenue30d },
          ordersCount,
          avgTicket,
          tables: { occupied: tablesOccupied, total: totalTables, occupancyRate },
          openTabs,
          revenueSeries,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/operational-metrics?start=...&end=...
  async getOperationalMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // Average service time (customerSeatedAt -> paidAt)
      const avgServiceTimeResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("paidAt" - "customerSeatedAt")))/60 AS avg_service_minutes
        FROM "tabs"
        WHERE "customerSeatedAt" IS NOT NULL
          AND "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const avgServiceTime = Number((avgServiceTimeResult as any[])[0]?.avg_service_minutes ?? 0);

      // Average time from first order to payment
      const avgOrderToPaymentResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (t."paidAt" - first_order.created_at)))/60 AS avg_minutes
        FROM "tabs" t
        JOIN LATERAL (
          SELECT MIN("createdAt") as created_at
          FROM "orders"
          WHERE "tabId" = t.id
        ) first_order ON true
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
      `;
      const avgOrderToPayment = Number((avgOrderToPaymentResult as any[])[0]?.avg_minutes ?? 0);

      // Table turnover rate (closed tabs / total tables)
      const closedTabsCount = await prisma.tab.count({
        where: {
          status: 'CLOSED',
          closedAt: { gte: start, lte: end },
          type: 'TABLE'
        }
      });
      const totalTables = await prisma.table.count();
      const tableTurnoverRate = totalTables > 0 ? closedTabsCount / totalTables : 0;

      // Revenue by tab type (TABLE vs COUNTER)
      const revenueByTypeResult = await prisma.$queryRaw`
        SELECT type, ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue, COUNT(*) as count
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
        GROUP BY type
      `;
      const revenueByType = (revenueByTypeResult as any[]).map(r => ({
        type: r.type,
        revenue: Number(r.revenue),
        count: Number(r.count)
      }));

      // Occupancy by hour (for today or selected day)
      const occupancyByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") AS hour,
          COUNT(DISTINCT "tableId") AS tables_used
        FROM "tabs"
        WHERE "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND type = 'TABLE'
        GROUP BY hour
        ORDER BY hour
      `;
      const occupancyByHour = (occupancyByHourResult as any[]).map(r => ({
        hour: Number(r.hour),
        tablesUsed: Number(r.tables_used),
        occupancyRate: totalTables > 0 ? (Number(r.tables_used) / totalTables) * 100 : 0
      }));

      res.json({
        success: true,
        data: {
          avgServiceTime,
          avgOrderToPayment,
          tableTurnoverRate,
          revenueByType,
          occupancyByHour
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
