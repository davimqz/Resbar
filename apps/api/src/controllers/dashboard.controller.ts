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

      const dailyRevenue = dailyRevenueTabs.reduce((sum: number, tab: any) => sum + (tab.total ?? 0), 0);

      // Contagem de pedidos por status
      const orderCounts = await prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      const oc = orderCounts as any[];
      const ordersCount = {
        pending: oc.find((o: any) => o.status === 'PENDING')?._count.status || 0,
        preparing: oc.find((o: any) => o.status === 'PREPARING')?._count.status || 0,
        ready: oc.find((o: any) => o.status === 'READY')?._count.status || 0,
        delivered: oc.find((o: any) => o.status === 'DELIVERED')?._count.status || 0,
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

      const menuItemIds = (popularItemsData as any[]).map((item: any) => item.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
        },
      });

      const popularItems = (popularItemsData as any[]).map((item: any) => {
        const menuItem = (menuItems as any[]).find((mi: any) => mi.id === item.menuItemId);
        return {
          itemId: item.menuItemId,
          itemName: menuItem?.name || 'Item desconhecido',
          totalSold: item._sum?.quantity || 0,
          revenue: item._sum?.totalPrice || 0,
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

      const tableIds = (waiterStats as any[]).map((stat: any) => stat.tableId).filter(Boolean) as string[];
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

      (waiterStats as any[]).forEach((stat: any) => {
        const table = (tables as any[]).find((t: any) => t.id === stat.tableId);
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

      const og = ordersGroup as any[];
      const ordersCount = {
        pending: og.find((o: any) => o.status === 'PENDING')?._count.status || 0,
        preparing: og.find((o: any) => o.status === 'PREPARING')?._count.status || 0,
        ready: og.find((o: any) => o.status === 'READY')?._count.status || 0,
        delivered: og.find((o: any) => o.status === 'DELIVERED')?._count.status || 0,
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

  // GET /api/dashboard/overview-waiters?start=...&end=...
  // Dashboard Visão Geral focado em métricas de garçons
  async getOverviewWaiters(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // === 1) KPIs EXECUTIVOS ===
      
      // Receita total por garçons (no período)
      const totalRevenueResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE(t."paidAmount", t.total))::numeric, 2)::double precision AS revenue
        FROM tab_waiter_history h
        JOIN "tabs" t ON t.id = h."tabId"
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
          AND (h."removedAt" IS NULL OR h."removedAt" > t."paidAt")
      `;
      const totalRevenue = Number((totalRevenueResult as any[])[0]?.revenue ?? 0);

      // Ticket médio geral
      const ticketResult = await prisma.$queryRaw`
        SELECT AVG(COALESCE("paidAmount", total))::double precision AS avg_ticket, COUNT(*) AS tabs_count
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const avgTicket = Number((ticketResult as any[])[0]?.avg_ticket ?? 0);
      const tabsCount = Number((ticketResult as any[])[0]?.tabs_count ?? 0);

      // Tempo médio até entrega (sentToKitchenAt -> deliveredAt)
      const avgDeliveryResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt")))/60 AS avg_delivery_minutes
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const avgDeliveryTime = Number((avgDeliveryResult as any[])[0]?.avg_delivery_minutes ?? 0);

      // Comandas fechadas
      const closedTabs = await prisma.tab.count({
        where: {
          status: 'CLOSED',
          paidAt: { gte: start, lte: end }
        }
      });

      // Receita por hora de garçom (usando horas trabalhadas)
      const revenuePerHourResult = await prisma.$queryRaw`
        SELECT 
          w.id AS waiter_id,
          w.name AS waiter_name,
          ROUND(SUM(COALESCE(t."paidAmount", t.total))::numeric, 2)::double precision AS revenue,
          ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(w."clockedOutAt", ${end}) - w."clockedInAt")))/3600::numeric, 2)::double precision AS hours_worked
        FROM waiters w
        LEFT JOIN tables tbl ON tbl."waiterId" = w.id
        LEFT JOIN "tabs" t ON t."tableId" = tbl.id AND t."paidAt" IS NOT NULL AND t."paidAt" >= ${start} AND t."paidAt" <= ${end}
        WHERE w."clockedInAt" IS NOT NULL
          AND w."clockedInAt" <= ${end}
          AND (w."clockedOutAt" IS NULL OR w."clockedOutAt" >= ${start})
        GROUP BY w.id, w.name
        HAVING AVG(EXTRACT(EPOCH FROM (COALESCE(w."clockedOutAt", ${end}) - w."clockedInAt"))) > 0
      `;
      
      const revenuePerHour = (revenuePerHourResult as any[]).map((r: any) => ({
        waiterId: r.waiter_id,
        waiterName: r.waiter_name,
        revenue: Number(r.revenue ?? 0),
        hoursWorked: Number(r.hours_worked ?? 0),
        revenuePerHour: r.hours_worked > 0 ? Number(r.revenue ?? 0) / Number(r.hours_worked) : 0
      }));

      // === 2) RANKING DE GARÇONS ===
      const waiterRankingResult = await prisma.$queryRaw`
        SELECT 
          w.id AS waiter_id,
          w.name AS waiter_name,
          ROUND(SUM(COALESCE(t."paidAmount", t.total))::numeric, 2)::double precision AS revenue,
          COUNT(DISTINCT t.id) AS tabs_count,
          ROUND(AVG(COALESCE(t."paidAmount", t.total))::numeric, 2)::double precision AS avg_ticket,
          ROUND(AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt")))/60::numeric, 2)::double precision AS avg_delivery_minutes
        FROM tab_waiter_history h
        JOIN waiters w ON w.id = h."waiterId"
        JOIN "tabs" t ON t.id = h."tabId"
        LEFT JOIN "orders" o ON o."tabId" = t.id AND o."sentToKitchenAt" IS NOT NULL AND o."deliveredAt" IS NOT NULL
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
          AND (h."removedAt" IS NULL OR h."removedAt" > t."paidAt")
        GROUP BY w.id, w.name
        ORDER BY revenue DESC
      `;

      const waiterRanking = (waiterRankingResult as any[]).map((r: any) => ({
        waiterId: r.waiter_id,
        waiterName: r.waiter_name,
        revenue: Number(r.revenue ?? 0),
        tabsCount: Number(r.tabs_count ?? 0),
        avgTicket: Number(r.avg_ticket ?? 0),
        avgDeliveryMinutes: Number(r.avg_delivery_minutes ?? 0)
      }));

      // Adicionar receita/hora ao ranking
      const rankingWithHours = waiterRanking.map(w => {
        const hourData = revenuePerHour.find(r => r.waiterId === w.waiterId);
        return {
          ...w,
          hoursWorked: hourData?.hoursWorked ?? 0,
          revenuePerHour: hourData?.revenuePerHour ?? 0
        };
      });

      // === 3) DISTRIBUIÇÃO E EQUILÍBRIO ===
      
      // Comandas por garçom (percentual)
      const tabsDistribution = waiterRanking.map(w => ({
        waiterId: w.waiterId,
        waiterName: w.waiterName,
        tabsCount: w.tabsCount,
        percentage: tabsCount > 0 ? (w.tabsCount / tabsCount) * 100 : 0
      }));

      // Tempo médio por garçom
      const avgTimeByWaiter = waiterRanking.map(w => ({
        waiterId: w.waiterId,
        waiterName: w.waiterName,
        avgDeliveryMinutes: w.avgDeliveryMinutes
      }));

      // Histórico de garçom na comanda (trocas)
      const waiterHistoryResult = await prisma.$queryRaw`
        SELECT 
          h."tabId" AS tab_id,
          COUNT(h.id) AS assignments_count,
          COUNT(DISTINCT h."waiterId") AS unique_waiters,
          AVG(EXTRACT(EPOCH FROM (COALESCE(h."removedAt", ${end}) - h."assignedAt")))/60 AS avg_assignment_minutes
        FROM tab_waiter_history h
        JOIN "tabs" t ON t.id = h."tabId"
        WHERE t."createdAt" >= ${start}
          AND t."createdAt" <= ${end}
        GROUP BY h."tabId"
        HAVING COUNT(h.id) > 1
        ORDER BY assignments_count DESC
        LIMIT 20
      `;

      const waiterHistory = (waiterHistoryResult as any[]).map((r: any) => ({
        tabId: r.tab_id,
        assignmentsCount: Number(r.assignments_count ?? 0),
        uniqueWaiters: Number(r.unique_waiters ?? 0),
        avgAssignmentMinutes: Number(r.avg_assignment_minutes ?? 0)
      }));

      // === 4) ALERTAS INTELIGENTES ===
      
      const avgDeliveryTimeOverall = avgDeliveryTime;
      const avgTicketOverall = avgTicket;
      
      const alerts = [];

      // Garçons com tempo médio acima da média
      for (const w of waiterRanking) {
        if (w.avgDeliveryMinutes > avgDeliveryTimeOverall * 1.2) {
          alerts.push({
            type: 'SLOW_DELIVERY',
            waiterId: w.waiterId,
            waiterName: w.waiterName,
            value: w.avgDeliveryMinutes,
            threshold: avgDeliveryTimeOverall,
            message: `Tempo de entrega ${Math.round(w.avgDeliveryMinutes)}min está 20% acima da média (${Math.round(avgDeliveryTimeOverall)}min)`
          });
        }

        // Garçom com queda de ticket médio
        if (w.avgTicket < avgTicketOverall * 0.8) {
          alerts.push({
            type: 'LOW_TICKET',
            waiterId: w.waiterId,
            waiterName: w.waiterName,
            value: w.avgTicket,
            threshold: avgTicketOverall,
            message: `Ticket médio R$ ${w.avgTicket.toFixed(2)} está 20% abaixo da média (R$ ${avgTicketOverall.toFixed(2)})`
          });
        }

        // Garçom com poucas comandas por hora
        const hourData = revenuePerHour.find(r => r.waiterId === w.waiterId);
        if (hourData && hourData.hoursWorked > 0) {
          const tabsPerHour = w.tabsCount / hourData.hoursWorked;
          if (tabsPerHour < 1.5 && hourData.hoursWorked >= 2) {
            alerts.push({
              type: 'LOW_PRODUCTIVITY',
              waiterId: w.waiterId,
              waiterName: w.waiterName,
              value: tabsPerHour,
              threshold: 1.5,
              message: `Apenas ${tabsPerHour.toFixed(1)} comandas/hora em ${hourData.hoursWorked.toFixed(1)}h trabalhadas`
            });
          }
        }
      }

      // === 5) COMPARAÇÃO COM PERÍODO ANTERIOR ===
      
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = new Date(start.getTime());

      const previousRevenueResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE(t."paidAmount", t.total))::numeric, 2)::double precision AS revenue
        FROM tab_waiter_history h
        JOIN "tabs" t ON t.id = h."tabId"
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${previousStart}
          AND t."paidAt" < ${previousEnd}
          AND (h."removedAt" IS NULL OR h."removedAt" > t."paidAt")
      `;
      const previousRevenue = Number((previousRevenueResult as any[])[0]?.revenue ?? 0);

      const previousTicketResult = await prisma.$queryRaw`
        SELECT AVG(COALESCE("paidAmount", total))::double precision AS avg_ticket
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${previousStart}
          AND "paidAt" < ${previousEnd}
      `;
      const previousAvgTicket = Number((previousTicketResult as any[])[0]?.avg_ticket ?? 0);

      const previousDeliveryResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt")))/60 AS avg_delivery_minutes
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${previousStart}
          AND "createdAt" < ${previousEnd}
      `;
      const previousAvgDeliveryTime = Number((previousDeliveryResult as any[])[0]?.avg_delivery_minutes ?? 0);

      const comparison = {
        revenue: {
          current: totalRevenue,
          previous: previousRevenue,
          change: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
        },
        avgTicket: {
          current: avgTicket,
          previous: previousAvgTicket,
          change: previousAvgTicket > 0 ? ((avgTicket - previousAvgTicket) / previousAvgTicket) * 100 : 0
        },
        avgDeliveryTime: {
          current: avgDeliveryTime,
          previous: previousAvgDeliveryTime,
          change: previousAvgDeliveryTime > 0 ? ((avgDeliveryTime - previousAvgDeliveryTime) / previousAvgDeliveryTime) * 100 : 0
        }
      };

      res.json({
        success: true,
        data: {
          // KPIs Executivos
          kpis: {
            totalRevenue,
            avgTicket,
            avgDeliveryTime,
            closedTabs,
            revenuePerHour: revenuePerHour.reduce((sum, r) => sum + r.revenuePerHour, 0) / (revenuePerHour.length || 1)
          },
          // Ranking
          waiterRanking: rankingWithHours,
          // Distribuição
          distribution: {
            tabsDistribution,
            avgTimeByWaiter,
            waiterHistory
          },
          // Alertas
          alerts,
          // Comparação
          comparison
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
