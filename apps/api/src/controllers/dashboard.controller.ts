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

      // Revenue by payment method - combina dados legados (Tab.paymentMethod) e novos (Payment table)
      const revenueByPaymentRows = await prisma.$queryRaw`
        SELECT "paymentMethod", ROUND(SUM(revenue)::numeric, 2)::double precision AS revenue
        FROM (
          -- Dados legados: pagamentos armazenados diretamente no Tab
          SELECT "paymentMethod", COALESCE("paidAmount", total) AS revenue
          FROM "tabs"
          WHERE "paidAt" IS NOT NULL
            AND "paidAt" >= ${start}
            AND "paidAt" <= ${end}
            AND "paymentMethod" IS NOT NULL
          
          UNION ALL
          
          -- Novos dados: múltiplos pagamentos na tabela Payment
          SELECT p."paymentMethod", p.amount AS revenue
          FROM "payments" p
          JOIN "tabs" t ON t.id = p."tabId"
          WHERE t."paidAt" IS NOT NULL
            AND t."paidAt" >= ${start}
            AND t."paidAt" <= ${end}
        ) AS combined_payments
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

      // Taxa de serviço total arrecadada no período
      const totalServiceChargeResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE(t."serviceChargeAmount", 0))::numeric, 2)::double precision AS total_service_charge
        FROM tab_waiter_history h
        JOIN "tabs" t ON t.id = h."tabId"
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
          AND (h."removedAt" IS NULL OR h."removedAt" > t."paidAt")
      `;
      const totalServiceCharge = Number((totalServiceChargeResult as any[])[0]?.total_service_charge ?? 0);

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
            revenuePerHour: revenuePerHour.reduce((sum, r) => sum + r.revenuePerHour, 0) / (revenuePerHour.length || 1),
            totalServiceCharge
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
  
  // GET /api/dashboard/overview-finance?start=...&end=...
  // Dashboard Visão Geral focado em métricas financeiras
  async getOverviewFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // === 1) KPIs EXECUTIVOS ===
      
      // Receita total no período
      const totalRevenueResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const totalRevenue = Number((totalRevenueResult as any[])[0]?.revenue ?? 0);

      // Ticket médio
      const ticketResult = await prisma.$queryRaw`
        SELECT 
          AVG(COALESCE("paidAmount", total))::double precision AS avg_ticket,
          COUNT(*) AS tabs_count
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const avgTicket = Number((ticketResult as any[])[0]?.avg_ticket ?? 0);
      const paidTabsCount = Number((ticketResult as any[])[0]?.tabs_count ?? 0);

      // Receita por método de pagamento - combina dados legados (Tab.paymentMethod) e novos (Payment table)
      const revenueByPaymentResult = await prisma.$queryRaw`
        SELECT 
          "paymentMethod",
          ROUND(SUM(revenue)::numeric, 2)::double precision AS revenue,
          COUNT(*) AS count
        FROM (
          -- Dados legados: pagamentos armazenados diretamente no Tab
          SELECT "paymentMethod", COALESCE("paidAmount", total) AS revenue
          FROM "tabs"
          WHERE "paidAt" IS NOT NULL
            AND "paidAt" >= ${start}
            AND "paidAt" <= ${end}
            AND "paymentMethod" IS NOT NULL
          
          UNION ALL
          
          -- Novos dados: múltiplos pagamentos na tabela Payment
          SELECT p."paymentMethod", p.amount AS revenue
          FROM "payments" p
          JOIN "tabs" t ON t.id = p."tabId"
          WHERE t."paidAt" IS NOT NULL
            AND t."paidAt" >= ${start}
            AND t."paidAt" <= ${end}
        ) AS combined_payments
        GROUP BY "paymentMethod"
        ORDER BY revenue DESC
      `;
      
      const revenueByPayment = (revenueByPaymentResult as any[]).map((r: any) => ({
        method: r.paymentMethod,
        revenue: Number(r.revenue ?? 0),
        count: Number(r.count ?? 0),
        percentage: totalRevenue > 0 ? (Number(r.revenue ?? 0) / totalRevenue) * 100 : 0
      }));

      // Total de taxa de serviço arrecadada
      const serviceChargeResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE("serviceChargeAmount", 0))::numeric, 2)::double precision AS total_service_charge
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const totalServiceCharge = Number((serviceChargeResult as any[])[0]?.total_service_charge ?? 0);

      // === 2) DISTRIBUIÇÕES FINANCEIRAS ===
      
      // Receita por dia
      const revenueByDayResult = await prisma.$queryRaw`
        SELECT 
          date_trunc('day', "paidAt")::date AS day,
          ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue,
          COUNT(*) AS tabs_count
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
        GROUP BY day
        ORDER BY day
      `;
      
      const revenueByDay = (revenueByDayResult as any[]).map((r: any) => ({
        day: r.day,
        revenue: Number(r.revenue ?? 0),
        tabsCount: Number(r.tabs_count ?? 0)
      }));

      // Receita por turno (aproximação usando hora do dia)
      const revenueByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "paidAt") AS hour,
          ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue,
          COUNT(*) AS tabs_count
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
        GROUP BY hour
        ORDER BY hour
      `;
      
      const revenueByHour = (revenueByHourResult as any[]).map((r: any) => {
        const hour = Number(r.hour);
        let shift = 'Madrugada';
        if (hour >= 6 && hour < 12) shift = 'Manhã';
        else if (hour >= 12 && hour < 18) shift = 'Tarde';
        else if (hour >= 18 && hour < 24) shift = 'Noite';
        
        return {
          hour,
          shift,
          revenue: Number(r.revenue ?? 0),
          tabsCount: Number(r.tabs_count ?? 0)
        };
      });

      // Agrupar por turno
      const revenueByShift = revenueByHour.reduce((acc: any[], curr) => {
        const existing = acc.find(s => s.shift === curr.shift);
        if (existing) {
          existing.revenue += curr.revenue;
          existing.tabsCount += curr.tabsCount;
        } else {
          acc.push({ shift: curr.shift, revenue: curr.revenue, tabsCount: curr.tabsCount });
        }
        return acc;
      }, []);

      // Receita por garçom
      const revenueByWaiterResult = await prisma.$queryRaw`
        SELECT 
          w.id AS waiter_id,
          w.name AS waiter_name,
          ROUND(SUM(COALESCE(t."paidAmount", t.total))::numeric, 2)::double precision AS revenue,
          COUNT(DISTINCT t.id) AS tabs_count
        FROM tab_waiter_history h
        JOIN waiters w ON w.id = h."waiterId"
        JOIN "tabs" t ON t.id = h."tabId"
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
          AND (h."removedAt" IS NULL OR h."removedAt" > t."paidAt")
        GROUP BY w.id, w.name
        ORDER BY revenue DESC
        LIMIT 10
      `;
      
      const revenueByWaiter = (revenueByWaiterResult as any[]).map((r: any) => ({
        waiterId: r.waiter_id,
        waiterName: r.waiter_name,
        revenue: Number(r.revenue ?? 0),
        tabsCount: Number(r.tabs_count ?? 0),
        percentage: totalRevenue > 0 ? (Number(r.revenue ?? 0) / totalRevenue) * 100 : 0
      }));

      // === 3) INDICADORES COMPORTAMENTAIS ===
      
      // Tempo médio até pagamento
      const avgTimeToPaymentResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("paidAt" - "customerSeatedAt")))/60 AS avg_minutes
        FROM "tabs"
        WHERE "customerSeatedAt" IS NOT NULL
          AND "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const avgTimeToPayment = Number((avgTimeToPaymentResult as any[])[0]?.avg_minutes ?? 0);

      // Comandas unificadas vs individuais
      const tabTypeDistributionResult = await prisma.$queryRaw`
        SELECT 
          CASE WHEN "isUnifiedTab" = true THEN 'Unificada' ELSE 'Individual' END AS tab_type,
          COUNT(*) AS count,
          ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
        GROUP BY "isUnifiedTab"
      `;
      
      const tabTypeDistribution = (tabTypeDistributionResult as any[]).map((r: any) => ({
        type: r.tab_type,
        count: Number(r.count ?? 0),
        revenue: Number(r.revenue ?? 0),
        percentage: paidTabsCount > 0 ? (Number(r.count ?? 0) / paidTabsCount) * 100 : 0
      }));

      // Valor médio por item na comanda
      const avgItemValueResult = await prisma.$queryRaw`
        SELECT 
          AVG(o."unitPrice")::double precision AS avg_item_price,
          AVG(o."quantity")::double precision AS avg_quantity
        FROM "orders" o
        JOIN "tabs" t ON t.id = o."tabId"
        WHERE t."paidAt" IS NOT NULL
          AND t."paidAt" >= ${start}
          AND t."paidAt" <= ${end}
      `;
      const avgItemPrice = Number((avgItemValueResult as any[])[0]?.avg_item_price ?? 0);
      const avgQuantity = Number((avgItemValueResult as any[])[0]?.avg_quantity ?? 0);

      // === 4) ALERTAS FINANCEIROS ===
      
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = new Date(start.getTime());

      // Receita período anterior
      const previousRevenueResult = await prisma.$queryRaw`
        SELECT ROUND(SUM(COALESCE("paidAmount", total))::numeric, 2)::double precision AS revenue
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${previousStart}
          AND "paidAt" < ${previousEnd}
      `;
      const previousRevenue = Number((previousRevenueResult as any[])[0]?.revenue ?? 0);

      // Ticket médio período anterior
      const previousTicketResult = await prisma.$queryRaw`
        SELECT AVG(COALESCE("paidAmount", total))::double precision AS avg_ticket
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${previousStart}
          AND "paidAt" < ${previousEnd}
      `;
      const previousAvgTicket = Number((previousTicketResult as any[])[0]?.avg_ticket ?? 0);

      // Volume período anterior
      const previousTabsCount = await prisma.tab.count({
        where: {
          paidAt: { gte: previousStart, lt: previousEnd }
        }
      });

      const alerts = [];

      // Alerta: Queda de receita
      if (previousRevenue > 0) {
        const revenueChange = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
        if (revenueChange < -10) {
          alerts.push({
            type: 'REVENUE_DROP',
            severity: 'high',
            message: `Receita caiu ${Math.abs(revenueChange).toFixed(1)}% em relação ao período anterior`,
            value: totalRevenue,
            previous: previousRevenue,
            change: revenueChange
          });
        }
      }

      // Alerta: Queda de ticket médio
      if (previousAvgTicket > 0) {
        const ticketChange = ((avgTicket - previousAvgTicket) / previousAvgTicket) * 100;
        if (ticketChange < -10) {
          alerts.push({
            type: 'TICKET_DROP',
            severity: 'medium',
            message: `Ticket médio caiu ${Math.abs(ticketChange).toFixed(1)}% em relação ao período anterior`,
            value: avgTicket,
            previous: previousAvgTicket,
            change: ticketChange
          });
        }
      }

      // Alerta: Alta dependência de método de pagamento
      const maxPaymentPercentage = Math.max(...revenueByPayment.map(p => p.percentage));
      if (maxPaymentPercentage > 70) {
        const dominantMethod = revenueByPayment.find(p => p.percentage === maxPaymentPercentage);
        alerts.push({
          type: 'PAYMENT_DEPENDENCY',
          severity: 'low',
          message: `${maxPaymentPercentage.toFixed(1)}% da receita depende de ${dominantMethod?.method}`,
          value: maxPaymentPercentage,
          method: dominantMethod?.method
        });
      }

      // Alerta: Comandas com valor pago diferente do total
      const discrepancyResult = await prisma.$queryRaw`
        SELECT COUNT(*) AS count
        FROM "tabs"
        WHERE "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
          AND "paidAmount" IS NOT NULL
          AND ABS("paidAmount" - total) > 0.01
      `;
      const discrepancyCount = Number((discrepancyResult as any[])[0]?.count ?? 0);
      
      if (discrepancyCount > 0) {
        const discrepancyPercentage = (discrepancyCount / paidTabsCount) * 100;
        if (discrepancyPercentage > 5) {
          alerts.push({
            type: 'PAYMENT_DISCREPANCY',
            severity: 'high',
            message: `${discrepancyCount} comandas (${discrepancyPercentage.toFixed(1)}%) com divergência entre valor pago e total`,
            value: discrepancyCount,
            percentage: discrepancyPercentage
          });
        }
      }

      // === 5) TENDÊNCIAS ===
      
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
        tabsCount: {
          current: paidTabsCount,
          previous: previousTabsCount,
          change: previousTabsCount > 0 ? ((paidTabsCount - previousTabsCount) / previousTabsCount) * 100 : 0
        }
      };

      res.json({
        success: true,
        data: {
          // KPIs Executivos
          kpis: {
            totalRevenue,
            avgTicket,
            paidTabsCount,
            totalServiceCharge,
            revenueByPayment
          },
          // Distribuições
          distributions: {
            revenueByDay,
            revenueByShift,
            revenueByWaiter
          },
          // Indicadores Comportamentais
          behavioral: {
            avgTimeToPayment,
            tabTypeDistribution,
            avgItemPrice,
            avgQuantity
          },
          // Alertas
          alerts,
          // Tendências
          comparison
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/overview-operations?start=...&end=...
  // Dashboard Visão Geral focado em métricas operacionais
  async getOverviewOperations(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // === 1) KPIs OPERACIONAIS ===
      
      // Tempo médio até entrega (sentToKitchenAt -> deliveredAt)
      const avgDeliveryTimeResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt")))/60 AS avg_minutes
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const avgDeliveryTime = Number((avgDeliveryTimeResult as any[])[0]?.avg_minutes ?? 0);

      // Tempo médio até pagamento (customerSeatedAt -> paidAt)
      const avgTimeToPaymentResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("paidAt" - "customerSeatedAt")))/60 AS avg_minutes
        FROM "tabs"
        WHERE "customerSeatedAt" IS NOT NULL
          AND "paidAt" IS NOT NULL
          AND "paidAt" >= ${start}
          AND "paidAt" <= ${end}
      `;
      const avgTimeToPayment = Number((avgTimeToPaymentResult as any[])[0]?.avg_minutes ?? 0);

      // Comandas fechadas (throughput)
      const closedTabsCount = await prisma.tab.count({
        where: {
          status: 'CLOSED',
          closedAt: { gte: start, lte: end }
        }
      });

      // Throughput por hora
      const periodHours = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      const throughputPerHour = closedTabsCount / periodHours;

      // Taxa de utilização de mesas
      const totalTables = await prisma.table.count();
      const occupancyData = await prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT "tableId") AS tables_used,
          AVG(EXTRACT(EPOCH FROM (COALESCE("closedAt", ${end}) - "createdAt")))/3600 AS avg_occupied_hours
        FROM "tabs"
        WHERE type = 'TABLE'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const tablesUsed = Number((occupancyData as any[])[0]?.tables_used ?? 0);
      // avgOccupiedHours omitted (not used) to avoid unused variable warning
      const utilizationRate = totalTables > 0 ? (tablesUsed / totalTables) * 100 : 0;

      // Taxa de rotatividade de mesas
      const tableTurnoverRate = totalTables > 0 ? closedTabsCount / totalTables : 0;

      // === 2) FLUXO OPERACIONAL ===
      
      // Pedidos por hora (heatmap)
      const ordersByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") AS hour,
          COUNT(*) AS count
        FROM "orders"
        WHERE "createdAt" >= ${start}
          AND "createdAt" <= ${end}
        GROUP BY hour
        ORDER BY hour
      `;
      
      const ordersByHour = (ordersByHourResult as any[]).map((r: any) => ({
        hour: Number(r.hour),
        count: Number(r.count ?? 0)
      }));

      // Comandas por hora
      const tabsByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") AS hour,
          COUNT(*) AS count
        FROM "tabs"
        WHERE "createdAt" >= ${start}
          AND "createdAt" <= ${end}
        GROUP BY hour
        ORDER BY hour
      `;
      
      const tabsByHour = (tabsByHourResult as any[]).map((r: any) => ({
        hour: Number(r.hour),
        count: Number(r.count ?? 0)
      }));

      // Tempo médio por faixa horária
      const avgTimeByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM o."createdAt") AS hour,
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt")))/60 AS avg_delivery_minutes,
          AVG(EXTRACT(EPOCH FROM (t."paidAt" - t."customerSeatedAt")))/60 AS avg_payment_minutes
        FROM "orders" o
        JOIN "tabs" t ON t.id = o."tabId"
        WHERE o."sentToKitchenAt" IS NOT NULL
          AND o."deliveredAt" IS NOT NULL
          AND t."customerSeatedAt" IS NOT NULL
          AND t."paidAt" IS NOT NULL
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY hour
        ORDER BY hour
      `;
      
      const avgTimeByHour = (avgTimeByHourResult as any[]).map((r: any) => ({
        hour: Number(r.hour),
        avgDeliveryMinutes: Number(r.avg_delivery_minutes ?? 0),
        avgPaymentMinutes: Number(r.avg_payment_minutes ?? 0)
      }));

      // === 3) EFICIÊNCIA POR MESA ===
      
      const tableEfficiencyResult = await prisma.$queryRaw`
        SELECT 
          tbl.id AS table_id,
          tbl.number AS table_number,
          COUNT(t.id) AS tabs_count,
          AVG(EXTRACT(EPOCH FROM (t."closedAt" - t."createdAt")))/60 AS avg_occupied_minutes,
          SUM(EXTRACT(EPOCH FROM (t."closedAt" - t."createdAt")))/3600 AS total_occupied_hours
        FROM tables tbl
        LEFT JOIN "tabs" t ON t."tableId" = tbl.id 
          AND t.status = 'CLOSED'
          AND t."closedAt" >= ${start}
          AND t."closedAt" <= ${end}
        GROUP BY tbl.id, tbl.number
        ORDER BY tabs_count DESC
      `;
      
      const tableEfficiency = (tableEfficiencyResult as any[]).map((r: any) => ({
        tableId: r.table_id,
        tableNumber: r.table_number,
        tabsCount: Number(r.tabs_count ?? 0),
        avgOccupiedMinutes: Number(r.avg_occupied_minutes ?? 0),
        totalOccupiedHours: Number(r.total_occupied_hours ?? 0),
        turnoverRate: Number(r.tabs_count ?? 0)
      }));

      // === 4) ALERTAS OPERACIONAIS ===
      
      const alerts = [];

      // Alto percentual de pedidos acima do tempo esperado (>20min)
      const slowOrdersResult = await prisma.$queryRaw`
        SELECT COUNT(*) AS count
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt"))/60 > 20
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const slowOrdersCount = Number((slowOrdersResult as any[])[0]?.count ?? 0);
      const totalOrdersWithDelivery = await prisma.order.count({
        where: {
          sentToKitchenAt: { not: null },
          deliveredAt: { not: null },
          createdAt: { gte: start, lte: end }
        }
      });
      const slowOrdersPercentage = totalOrdersWithDelivery > 0 ? (slowOrdersCount / totalOrdersWithDelivery) * 100 : 0;

      if (slowOrdersPercentage > 15) {
        alerts.push({
          type: 'SLOW_ORDERS',
          severity: 'high',
          message: `${slowOrdersPercentage.toFixed(1)}% dos pedidos demoraram mais de 20 minutos`,
          value: slowOrdersPercentage,
          count: slowOrdersCount
        });
      }

      // Mesas com tempo excessivo sem fechamento
      const openTabsExcessiveTimeResult = await prisma.$queryRaw`
        SELECT 
          t.id AS tab_id,
          tbl.number AS table_number,
          EXTRACT(EPOCH FROM (${now} - t."customerSeatedAt"))/60 AS minutes_open
        FROM "tabs" t
        JOIN tables tbl ON tbl.id = t."tableId"
        WHERE t.status = 'OPEN'
          AND t."customerSeatedAt" IS NOT NULL
          AND EXTRACT(EPOCH FROM (${now} - t."customerSeatedAt"))/60 > ${avgTimeToPayment * 1.5}
        ORDER BY minutes_open DESC
        LIMIT 10
      `;
      
      const openTabsExcessiveTime = (openTabsExcessiveTimeResult as any[]).map((r: any) => ({
        tabId: r.tab_id,
        tableNumber: r.table_number,
        minutesOpen: Number(r.minutes_open ?? 0)
      }));

      if (openTabsExcessiveTime.length > 0) {
        alerts.push({
          type: 'EXCESSIVE_TIME',
          severity: 'medium',
          message: `${openTabsExcessiveTime.length} mesas abertas há mais de ${(avgTimeToPayment * 1.5).toFixed(0)} minutos`,
          value: openTabsExcessiveTime.length,
          tables: openTabsExcessiveTime
        });
      }

      // Baixa rotatividade em horário de pico
      const currentHour = now.getHours();
      const isPeakHour = currentHour >= 12 && currentHour <= 14 || currentHour >= 19 && currentHour <= 21;
      
      if (isPeakHour && tableTurnoverRate < 1.5) {
        alerts.push({
          type: 'LOW_PEAK_TURNOVER',
          severity: 'medium',
          message: `Rotatividade baixa (${tableTurnoverRate.toFixed(1)}x) em horário de pico`,
          value: tableTurnoverRate,
          threshold: 1.5
        });
      }

      // Concentração de pedidos em poucos garçons
      const waiterOrderDistributionResult = await prisma.$queryRaw`
        SELECT 
          w.id AS waiter_id,
          w.name AS waiter_name,
          COUNT(DISTINCT o.id) AS orders_count
        FROM waiters w
        JOIN tables tbl ON tbl."waiterId" = w.id
        JOIN "tabs" t ON t."tableId" = tbl.id
        JOIN "orders" o ON o."tabId" = t.id
        WHERE o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY w.id, w.name
        ORDER BY orders_count DESC
      `;
      
      const waiterOrderDistribution = (waiterOrderDistributionResult as any[]).map((r: any) => ({
        waiterId: r.waiter_id,
        waiterName: r.waiter_name,
        ordersCount: Number(r.orders_count ?? 0)
      }));

      const totalOrders = waiterOrderDistribution.reduce((sum, w) => sum + w.ordersCount, 0);
      const topWaiterPercentage = waiterOrderDistribution.length > 0 && totalOrders > 0
        ? (waiterOrderDistribution[0].ordersCount / totalOrders) * 100
        : 0;

      if (topWaiterPercentage > 40 && waiterOrderDistribution.length > 2) {
        alerts.push({
          type: 'WAITER_IMBALANCE',
          severity: 'low',
          message: `${topWaiterPercentage.toFixed(1)}% dos pedidos concentrados em ${waiterOrderDistribution[0].waiterName}`,
          value: topWaiterPercentage,
          waiter: waiterOrderDistribution[0].waiterName
        });
      }

      // === 5) ANÁLISE DE STATUS ===
      
      // Status dos pedidos
      const orderStatusResult = await prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { status: true }
      });

      const totalOrdersForStatus = orderStatusResult.reduce((sum: number, r: any) => sum + r._count.status, 0);
      const orderStatusDistribution = (orderStatusResult as any[]).map((r: any) => ({
        status: r.status,
        count: r._count.status,
        percentage: totalOrdersForStatus > 0 ? (r._count.status / totalOrdersForStatus) * 100 : 0
      }));

      // Status das comandas
      const tabStatusResult = await prisma.tab.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { status: true }
      });

      const totalTabsForStatus = tabStatusResult.reduce((sum: number, r: any) => sum + r._count.status, 0);
      const tabStatusDistribution = (tabStatusResult as any[]).map((r: any) => ({
        status: r.status,
        count: r._count.status,
        percentage: totalTabsForStatus > 0 ? (r._count.status / totalTabsForStatus) * 100 : 0
      }));

      res.json({
        success: true,
        data: {
          // KPIs Operacionais
          kpis: {
            avgDeliveryTime,
            avgTimeToPayment,
            closedTabsCount,
            throughputPerHour,
            utilizationRate,
            tableTurnoverRate
          },
          // Fluxo Operacional
          flow: {
            ordersByHour,
            tabsByHour,
            avgTimeByHour
          },
          // Eficiência por Mesa
          tableEfficiency,
          // Alertas
          alerts,
          // Status
          status: {
            orderStatusDistribution,
            tabStatusDistribution
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/overview-kitchen?start=...&end=...
  // Dashboard Visão Geral focado em métricas da cozinha
  async getOverviewKitchen(req: Request, res: Response, next: NextFunction) {
    try {
      const { start: startQ, end: endQ } = req.query as Record<string, string>;
      const now = new Date();
      const start = startQ ? new Date(startQ) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })();
      const end = endQ ? new Date(endQ) : now;

      // === 1) KPIs PRINCIPAIS ===
      
      // Tempo médio de preparo (sentToKitchenAt -> deliveredAt representa tempo total na cozinha)
      // Como não temos inicio_preparo separado, usamos sentToKitchenAt como início
      const avgPrepTimeResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt")))/60 AS avg_minutes
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const avgPrepTime = Number((avgPrepTimeResult as any[])[0]?.avg_minutes ?? 0);

      // Tempo médio total até entrega (sentToKitchenAt -> deliveredAt)
      const avgTotalTimeResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt")))/60 AS avg_minutes
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const avgTotalTime = Number((avgTotalTimeResult as any[])[0]?.avg_minutes ?? 0);

      // Percentual de pedidos atrasados (SLA: 20 minutos)
      const SLA_MINUTES = 20;
      const delayedOrdersResult = await prisma.$queryRaw`
        SELECT 
          COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt"))/60 > ${SLA_MINUTES}) AS delayed_count,
          COUNT(*) AS total_count
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
      `;
      const delayedCount = Number((delayedOrdersResult as any[])[0]?.delayed_count ?? 0);
      const totalDelivered = Number((delayedOrdersResult as any[])[0]?.total_count ?? 0);
      const delayedPercentage = totalDelivered > 0 ? (delayedCount / totalDelivered) * 100 : 0;

      // Volume de pedidos no período
      const ordersVolume = await prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      });

      // Pedidos simultâneos (pico) - aproximação: máximo de pedidos em preparo por hora
      const peakSimultaneousResult = await prisma.$queryRaw`
        SELECT 
          date_trunc('hour', "sentToKitchenAt") AS hour,
          COUNT(*) AS simultaneous_count
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "sentToKitchenAt" >= ${start}
          AND "sentToKitchenAt" <= ${end}
          AND status IN ('PREPARING', 'READY')
        GROUP BY hour
        ORDER BY simultaneous_count DESC
        LIMIT 1
      `;
      const peakSimultaneous = Number((peakSimultaneousResult as any[])[0]?.simultaneous_count ?? 0);

      // === 2) ANÁLISE POR ITEM ===
      
      // Itens com maior tempo médio de preparo
      const itemsByPrepTimeResult = await prisma.$queryRaw`
        SELECT 
          mi.id AS item_id,
          mi.name AS item_name,
          mi.category AS item_category,
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt")))/60 AS avg_prep_minutes,
          COUNT(*) AS orders_count,
          SUM(o.quantity) AS total_quantity
        FROM "orders" o
        JOIN "menu_items" mi ON mi.id = o."menuItemId"
        WHERE o."sentToKitchenAt" IS NOT NULL
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category
        ORDER BY avg_prep_minutes DESC
        LIMIT 15
      `;
      
      const itemsByPrepTime = (itemsByPrepTimeResult as any[]).map((r: any) => ({
        itemId: r.item_id,
        itemName: r.item_name,
        itemCategory: r.item_category,
        avgPrepMinutes: Number(r.avg_prep_minutes ?? 0),
        ordersCount: Number(r.orders_count ?? 0),
        totalQuantity: Number(r.total_quantity ?? 0)
      }));

      // Itens mais vendidos
      const topItemsResult = await prisma.$queryRaw`
        SELECT 
          mi.id AS item_id,
          mi.name AS item_name,
          mi.category AS item_category,
          SUM(o.quantity) AS total_quantity,
          COUNT(DISTINCT o.id) AS orders_count,
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt")))/60 AS avg_prep_minutes
        FROM "orders" o
        JOIN "menu_items" mi ON mi.id = o."menuItemId"
        WHERE o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category
        ORDER BY total_quantity DESC
        LIMIT 15
      `;
      
      const topItems = (topItemsResult as any[]).map((r: any) => ({
        itemId: r.item_id,
        itemName: r.item_name,
        itemCategory: r.item_category,
        totalQuantity: Number(r.total_quantity ?? 0),
        ordersCount: Number(r.orders_count ?? 0),
        avgPrepMinutes: Number(r.avg_prep_minutes ?? 0)
      }));

      // Itens críticos (alto tempo + alto volume)
      const criticalItems = itemsByPrepTime
        .filter(item => {
          const avgTime = itemsByPrepTime.reduce((sum, i) => sum + i.avgPrepMinutes, 0) / itemsByPrepTime.length;
          const avgVolume = itemsByPrepTime.reduce((sum, i) => sum + i.totalQuantity, 0) / itemsByPrepTime.length;
          return item.avgPrepMinutes > avgTime * 1.2 && item.totalQuantity > avgVolume * 0.8;
        })
        .slice(0, 10);

      // === 3) DISTRIBUIÇÃO TEMPORAL ===
      
      // Tempo médio por faixa horária
      const avgTimeByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM o."sentToKitchenAt") AS hour,
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt")))/60 AS avg_prep_minutes,
          COUNT(*) AS orders_count
        FROM "orders" o
        WHERE o."sentToKitchenAt" IS NOT NULL
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY hour
        ORDER BY hour
      `;
      
      const avgTimeByHour = (avgTimeByHourResult as any[]).map((r: any) => ({
        hour: Number(r.hour),
        avgPrepMinutes: Number(r.avg_prep_minutes ?? 0),
        ordersCount: Number(r.orders_count ?? 0)
      }));

      // Volume de pedidos por hora
      const volumeByHourResult = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") AS hour,
          COUNT(*) AS orders_count
        FROM "orders"
        WHERE "createdAt" >= ${start}
          AND "createdAt" <= ${end}
        GROUP BY hour
        ORDER BY hour
      `;
      
      const volumeByHour = (volumeByHourResult as any[]).map((r: any) => ({
        hour: Number(r.hour),
        ordersCount: Number(r.orders_count ?? 0)
      }));

      // === 4) ALERTAS INTELIGENTES ===
      
      const alerts = [];

      // Período anterior para comparação
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = new Date(start.getTime());

      // Tempo médio período anterior
      const previousAvgTimeResult = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "sentToKitchenAt")))/60 AS avg_minutes
        FROM "orders"
        WHERE "sentToKitchenAt" IS NOT NULL
          AND "deliveredAt" IS NOT NULL
          AND "createdAt" >= ${previousStart}
          AND "createdAt" < ${previousEnd}
      `;
      const previousAvgTime = Number((previousAvgTimeResult as any[])[0]?.avg_minutes ?? 0);

      // Alerta: Aumento de tempo médio
      if (previousAvgTime > 0) {
        const timeChange = ((avgPrepTime - previousAvgTime) / previousAvgTime) * 100;
        if (timeChange > 15) {
          alerts.push({
            type: 'PREP_TIME_INCREASE',
            severity: 'high',
            message: `Tempo médio de preparo aumentou ${timeChange.toFixed(1)}% em relação ao período anterior`,
            value: avgPrepTime,
            previous: previousAvgTime,
            change: timeChange
          });
        }
      }

      // Alerta: Percentual de atraso alto
      if (delayedPercentage > 25) {
        alerts.push({
          type: 'HIGH_DELAY_RATE',
          severity: 'high',
          message: `${delayedPercentage.toFixed(1)}% dos pedidos estão atrasados (SLA: ${SLA_MINUTES} min)`,
          value: delayedPercentage,
          threshold: 25,
          delayedCount
        });
      }

      // Volume anterior
      const previousVolume = await prisma.order.count({
        where: {
          createdAt: { gte: previousStart, lt: previousEnd }
        }
      });

      // Alerta: Crescimento de volume sem capacidade
      if (previousVolume > 0 && previousAvgTime > 0) {
        const volumeChange = ((ordersVolume - previousVolume) / previousVolume) * 100;
        const timeChange = ((avgPrepTime - previousAvgTime) / previousAvgTime) * 100;
        
        if (volumeChange > 20 && timeChange > 10) {
          alerts.push({
            type: 'VOLUME_WITHOUT_CAPACITY',
            severity: 'medium',
            message: `Volume aumentou ${volumeChange.toFixed(1)}% mas tempo de preparo também subiu ${timeChange.toFixed(1)}%`,
            volumeChange,
            timeChange
          });
        }
      }

      // Alerta: Item crítico com tempo fora da curva
      if (itemsByPrepTime.length > 0 && avgPrepTime > 0) {
        const criticalItem = itemsByPrepTime.find(item => item.avgPrepMinutes > avgPrepTime * 2);
        if (criticalItem) {
          alerts.push({
            type: 'CRITICAL_ITEM',
            severity: 'medium',
            message: `Item "${criticalItem.itemName}" está ${((criticalItem.avgPrepMinutes / avgPrepTime - 1) * 100).toFixed(0)}% acima do tempo médio`,
            itemName: criticalItem.itemName,
            value: criticalItem.avgPrepMinutes,
            average: avgPrepTime
          });
        }
      }

      // === 5) STATUS OPERACIONAL ===
      
      // Status dos pedidos
      const orderStatusResult = await prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { status: true }
      });

      const totalOrders = orderStatusResult.reduce((sum: number, r: any) => sum + r._count.status, 0);
      const orderStatus = (orderStatusResult as any[]).map((r: any) => ({
        status: r.status,
        count: r._count.status,
        percentage: totalOrders > 0 ? (r._count.status / totalOrders) * 100 : 0
      }));

      res.json({
        success: true,
        data: {
          // KPIs Principais
          kpis: {
            avgPrepTime,
            avgTotalTime,
            delayedPercentage,
            delayedCount,
            ordersVolume,
            peakSimultaneous,
            slaMinutes: SLA_MINUTES
          },
          // Análise por Item
          items: {
            byPrepTime: itemsByPrepTime,
            topSelling: topItems,
            critical: criticalItems
          },
          // Distribuição Temporal
          temporal: {
            avgTimeByHour,
            volumeByHour
          },
          // Alertas
          alerts,
          // Status
          status: orderStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  getOverviewMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { start: startParam, end: endParam } = req.query;
      
      const start = startParam ? new Date(startParam as string) : (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      })();

      const end = endParam ? new Date(endParam as string) : new Date();

      // Calcular período anterior para comparações
      const duration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - duration);
      const previousEnd = start;

      // === 1) TOP ITENS MAIS VENDIDOS (por quantidade) ===
      const topItemsByVolume: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          mi.name as "itemName",
          mi.category as "itemCategory",
          mi.price as "itemPrice",
          mi.available as "itemAvailable",
          SUM(o.quantity) as "totalQuantity",
          COUNT(DISTINCT o.id) as "ordersCount",
          SUM(o.quantity * mi.price) as "totalRevenue"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category, mi.price, mi.available
        ORDER BY "totalQuantity" DESC
        LIMIT 10
      `;

      // === 2) TOP ITENS POR RECEITA ===
      const topItemsByRevenue: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          mi.name as "itemName",
          mi.category as "itemCategory",
          mi.price as "itemPrice",
          SUM(o.quantity * mi.price) as "totalRevenue",
          SUM(o.quantity) as "totalQuantity",
          COUNT(DISTINCT o.id) as "ordersCount"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category, mi.price
        ORDER BY "totalRevenue" DESC
        LIMIT 10
      `;

      // === 3) RECEITA POR CATEGORIA ===
      const revenueByCategory: any[] = await prisma.$queryRaw`
        SELECT 
          mi.category as "category",
          SUM(o.quantity * mi.price) as "totalRevenue",
          SUM(o.quantity) as "totalQuantity",
          COUNT(DISTINCT o.id) as "ordersCount",
          COUNT(DISTINCT mi.id) as "itemsCount"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end}
        GROUP BY mi.category
        ORDER BY "totalRevenue" DESC
      `;

      const totalRevenue = revenueByCategory.reduce((sum, c) => sum + parseFloat(c.totalRevenue || 0), 0);

      const categoryDistribution = revenueByCategory.map((cat: any) => ({
        category: cat.category || 'Sem categoria',
        totalRevenue: parseFloat(cat.totalRevenue || 0),
        totalQuantity: parseInt(cat.totalQuantity || 0),
        ordersCount: parseInt(cat.ordersCount || 0),
        itemsCount: parseInt(cat.itemsCount || 0),
        revenuePercentage: totalRevenue > 0 ? (parseFloat(cat.totalRevenue || 0) / totalRevenue) * 100 : 0
      }));

      // === 4) TEMPO MÉDIO DE PREPARO POR ITEM ===
      const prepTimeByItem: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          mi.name as "itemName",
          mi.category as "itemCategory",
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60) as "avgPrepMinutes",
          SUM(o.quantity) as "totalQuantity",
          COUNT(o.id) as "ordersCount"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."sentToKitchenAt" IS NOT NULL 
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start} 
          AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category
        ORDER BY "avgPrepMinutes" DESC
        LIMIT 15
      `;

      const itemsWithPrepTime = prepTimeByItem.map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        itemCategory: item.itemCategory,
        avgPrepMinutes: parseFloat(item.avgPrepMinutes || 0),
        totalQuantity: parseInt(item.totalQuantity || 0),
        ordersCount: parseInt(item.ordersCount || 0)
      }));

      // === 5) ITENS INDISPONÍVEIS ===
      const unavailableItems = await prisma.menuItem.findMany({
        where: { available: false },
        select: {
          id: true,
          name: true,
          category: true,
          price: true
        }
      });

      // Pegar vendas históricas dos itens indisponíveis (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const unavailableWithHistory = await Promise.all(
        unavailableItems.map(async (item: any) => {
          const history: any[] = await prisma.$queryRaw`
            SELECT 
              SUM(quantity) as "totalQuantity",
              COUNT(id) as "ordersCount"
            FROM orders
            WHERE "menuItemId" = ${item.id}
              AND "createdAt" >= ${thirtyDaysAgo}
              AND "createdAt" <= ${end}
          `;
          
          return {
            itemId: item.id,
            itemName: item.name,
            itemCategory: item.category,
            itemPrice: parseFloat(item.price.toString()),
            historicalVolume: parseInt(history[0]?.totalQuantity || 0)
          };
        })
      );

      // === 6) MATRIZ VOLUME x PREÇO (Análise Estratégica) ===
      
      // Calcular médias para classificação
      const allItemsData: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          mi.name as "itemName",
          mi.category as "itemCategory",
          mi.price as "itemPrice",
          mi.available as "itemAvailable",
          SUM(o.quantity) as "totalQuantity",
          SUM(o.quantity * mi.price) as "totalRevenue",
          COUNT(o.id) as "ordersCount"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category, mi.price, mi.available
      `;

      const volumes = allItemsData.map(i => parseInt(i.totalQuantity || 0));
      const prices = allItemsData.map(i => parseFloat(i.itemPrice || 0));
      
      const medianVolume = volumes.length > 0 
        ? volumes.sort((a, b) => a - b)[Math.floor(volumes.length / 2)] 
        : 0;
      const medianPrice = prices.length > 0 
        ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] 
        : 0;

      const strategicMatrix = allItemsData.map((item: any) => {
        const volume = parseInt(item.totalQuantity || 0);
        const price = parseFloat(item.itemPrice || 0);
        
        let quadrant: string;
        if (volume >= medianVolume && price >= medianPrice) {
          quadrant = 'star'; // Item estrela
        } else if (volume >= medianVolume && price < medianPrice) {
          quadrant = 'popular'; // Popular
        } else if (volume < medianVolume && price >= medianPrice) {
          quadrant = 'premium'; // Premium
        } else {
          quadrant = 'problematic'; // Problemático
        }

        return {
          itemId: item.itemId,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          itemPrice: price,
          totalQuantity: volume,
          totalRevenue: parseFloat(item.totalRevenue || 0),
          ordersCount: parseInt(item.ordersCount || 0),
          quadrant
        };
      });

      // Agrupar por quadrante
      const matrixByQuadrant = {
        star: strategicMatrix.filter(i => i.quadrant === 'star'),
        popular: strategicMatrix.filter(i => i.quadrant === 'popular'),
        premium: strategicMatrix.filter(i => i.quadrant === 'premium'),
        problematic: strategicMatrix.filter(i => i.quadrant === 'problematic')
      };

      // === 7) GARGALOS ESTRATÉGICOS (Alto Volume + Alto Tempo) ===
      
      const avgVolume = allItemsData.length > 0 
        ? allItemsData.reduce((sum, i) => sum + parseInt(i.totalQuantity || 0), 0) / allItemsData.length 
        : 0;
      
      const avgPrepTime = itemsWithPrepTime.length > 0 
        ? itemsWithPrepTime.reduce((sum, i) => sum + i.avgPrepMinutes, 0) / itemsWithPrepTime.length 
        : 0;

      const bottlenecks = itemsWithPrepTime
        .filter(item => {
          const hasHighVolume = item.totalQuantity > avgVolume * 0.8;
          const hasHighTime = item.avgPrepMinutes > avgPrepTime * 1.2;
          return hasHighVolume && hasHighTime;
        })
        .sort((a, b) => (b.totalQuantity * b.avgPrepMinutes) - (a.totalQuantity * a.avgPrepMinutes))
        .slice(0, 10);

      // === 8) ITENS COM BAIXO VOLUME ===
      
      const lowVolumeItems = allItemsData
        .filter(item => parseInt(item.totalQuantity || 0) < avgVolume * 0.5)
        .map((item: any) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          itemPrice: parseFloat(item.itemPrice || 0),
          totalQuantity: parseInt(item.totalQuantity || 0),
          totalRevenue: parseFloat(item.totalRevenue || 0),
          ordersCount: parseInt(item.ordersCount || 0)
        }))
        .sort((a, b) => a.totalQuantity - b.totalQuantity);

      // === 9) CONCENTRAÇÃO DE RECEITA ===
      
      const sortedByRevenue = [...allItemsData]
        .sort((a, b) => parseFloat(b.totalRevenue || 0) - parseFloat(a.totalRevenue || 0));
      
      let cumulativeRevenue = 0;
      let itemsFor80Pct = 0;
      const threshold80 = totalRevenue * 0.8;
      
      for (const item of sortedByRevenue) {
        cumulativeRevenue += parseFloat(item.totalRevenue || 0);
        itemsFor80Pct++;
        if (cumulativeRevenue >= threshold80) break;
      }

      const concentrationRatio = allItemsData.length > 0 
        ? (itemsFor80Pct / allItemsData.length) * 100 
        : 0;

      // === 10) TEMPO MÉDIO POR CATEGORIA ===
      
      const prepTimeByCategory: any[] = await prisma.$queryRaw`
        SELECT 
          mi.category as "category",
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60) as "avgPrepMinutes",
          COUNT(o.id) as "ordersCount",
          SUM(o.quantity) as "totalQuantity"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."sentToKitchenAt" IS NOT NULL 
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start} 
          AND o."createdAt" <= ${end}
        GROUP BY mi.category
        ORDER BY "avgPrepMinutes" DESC
      `;

      const categoryPrepTime = prepTimeByCategory.map((cat: any) => ({
        category: cat.category || 'Sem categoria',
        avgPrepMinutes: parseFloat(cat.avgPrepMinutes || 0),
        ordersCount: parseInt(cat.ordersCount || 0),
        totalQuantity: parseInt(cat.totalQuantity || 0)
      }));

      // === 11) PERCENTUAL DE ATRASO POR ITEM ===
      
      const SLA_MINUTES = 20;
      
      const delayByItem: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          mi.name as "itemName",
          mi.category as "itemCategory",
          COUNT(o.id) as "totalOrders",
          COUNT(o.id) FILTER (
            WHERE EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60 > ${SLA_MINUTES}
          ) as "delayedOrders"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."sentToKitchenAt" IS NOT NULL 
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start} 
          AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name, mi.category
        HAVING COUNT(o.id) >= 5
        ORDER BY "delayedOrders" DESC
        LIMIT 15
      `;

      const itemDelayRate = delayByItem.map((item: any) => {
        const total = parseInt(item.totalOrders || 0);
        const delayed = parseInt(item.delayedOrders || 0);
        return {
          itemId: item.itemId,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          totalOrders: total,
          delayedOrders: delayed,
          delayPercentage: total > 0 ? (delayed / total) * 100 : 0
        };
      });

      // === 12) COMPARAÇÃO COM PERÍODO ANTERIOR (para alertas) ===
      
      const previousItemsData: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          SUM(o.quantity) as "totalQuantity",
          SUM(o.quantity * mi.price) as "totalRevenue"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."createdAt" >= ${previousStart} AND o."createdAt" < ${previousEnd}
        GROUP BY mi.id
      `;

      const previousMap = new Map(
        previousItemsData.map((item: any) => [
          item.itemId,
          {
            quantity: parseInt(item.totalQuantity || 0),
            revenue: parseFloat(item.totalRevenue || 0)
          }
        ])
      );

      const previousPrepTime: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60) as "avgPrepMinutes"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE o."sentToKitchenAt" IS NOT NULL 
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${previousStart} 
          AND o."createdAt" < ${previousEnd}
        GROUP BY mi.id
      `;

      const previousPrepMap = new Map(
        previousPrepTime.map((item: any) => [
          item.itemId,
          parseFloat(item.avgPrepMinutes || 0)
        ])
      );

      // === 13) ALERTAS INTELIGENTES ===
      
      const alerts: any[] = [];

      // Alerta 1: Item muito vendido ficando indisponível
      unavailableWithHistory.forEach((item) => {
        if (item.historicalVolume > avgVolume * 0.8) {
          alerts.push({
            type: 'HIGH_DEMAND_UNAVAILABLE',
            severity: 'high',
            message: `"${item.itemName}" está indisponível, mas tinha alta demanda (${item.historicalVolume} vendas nos últimos 30 dias)`,
            itemId: item.itemId,
            itemName: item.itemName,
            historicalVolume: item.historicalVolume,
            avgVolume
          });
        }
      });

      // Alerta 2: Crescimento de tempo médio de preparo
      itemsWithPrepTime.forEach((item) => {
        const previousTime = previousPrepMap.get(item.itemId);
        if (previousTime && previousTime > 0) {
          const increase = ((item.avgPrepMinutes - previousTime) / previousTime) * 100;
          if (increase > 25) {
            alerts.push({
              type: 'PREP_TIME_INCREASE',
              severity: increase > 50 ? 'high' : 'medium',
              message: `Tempo de preparo de "${item.itemName}" aumentou ${increase.toFixed(1)}%`,
              itemId: item.itemId,
              itemName: item.itemName,
              previousTime,
              currentTime: item.avgPrepMinutes,
              increasePct: increase
            });
          }
        }
      });

      // Alerta 3: Queda de venda de item estratégico (top 10)
      const top10Ids = topItemsByVolume.slice(0, 10).map(i => i.itemId);
      allItemsData.forEach((item: any) => {
        if (top10Ids.includes(item.itemId)) {
          const previous = previousMap.get(item.itemId);
          if (previous && previous.quantity > 0) {
            const currentQty = parseInt(item.totalQuantity || 0);
            const decrease = ((previous.quantity - currentQty) / previous.quantity) * 100;
            if (decrease > 30) {
              alerts.push({
                type: 'STRATEGIC_ITEM_DECLINE',
                severity: 'medium',
                message: `Queda de ${decrease.toFixed(1)}% nas vendas de "${item.itemName}" (item estratégico)`,
                itemId: item.itemId,
                itemName: item.itemName,
                previousQuantity: previous.quantity,
                currentQuantity: currentQty,
                decreasePct: decrease
              });
            }
          }
        }
      });

      // Alerta 4: Concentração de receita excessiva
      if (concentrationRatio < 30 && allItemsData.length > 5) {
        const top3Revenue = sortedByRevenue.slice(0, 3).reduce(
          (sum, i) => sum + parseFloat(i.totalRevenue || 0), 
          0
        );
        const top3Pct = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0;
        
        if (top3Pct > 60) {
          alerts.push({
            type: 'REVENUE_CONCENTRATION',
            severity: 'medium',
            message: `${top3Pct.toFixed(1)}% da receita vem de apenas 3 itens — risco de dependência`,
            top3Items: sortedByRevenue.slice(0, 3).map((i: any) => i.itemName),
            concentrationPct: top3Pct
          });
        }
      }

      // Alerta 5: Itens problemáticos (baixo volume + baixo preço)
      const problematicCount = matrixByQuadrant.problematic.length;
      if (problematicCount > allItemsData.length * 0.3) {
        alerts.push({
          type: 'TOO_MANY_PROBLEMATIC',
          severity: 'low',
          message: `${problematicCount} itens com baixo volume e baixo preço — considere revisar cardápio`,
          problematicCount,
          items: matrixByQuadrant.problematic.slice(0, 5).map(i => i.itemName)
        });
      }

      // === RESPOSTA FINAL ===
      
      res.json({
        success: true,
        data: {
          // KPIs Principais
          kpis: {
            totalRevenue,
            totalItems: allItemsData.length,
            unavailableCount: unavailableItems.length,
            avgPrepTime,
            concentrationRatio
          },
          // Top Itens
          topItems: {
            byVolume: topItemsByVolume.slice(0, 5).map((item: any) => ({
              itemId: item.itemId,
              itemName: item.itemName,
              itemCategory: item.itemCategory,
              itemPrice: parseFloat(item.itemPrice || 0),
              totalQuantity: parseInt(item.totalQuantity || 0),
              ordersCount: parseInt(item.ordersCount || 0),
              totalRevenue: parseFloat(item.totalRevenue || 0)
            })),
            byRevenue: topItemsByRevenue.slice(0, 5).map((item: any) => ({
              itemId: item.itemId,
              itemName: item.itemName,
              itemCategory: item.itemCategory,
              itemPrice: parseFloat(item.itemPrice || 0),
              totalRevenue: parseFloat(item.totalRevenue || 0),
              totalQuantity: parseInt(item.totalQuantity || 0),
              ordersCount: parseInt(item.ordersCount || 0)
            }))
          },
          // Distribuição por Categoria
          categoryDistribution,
          categoryPrepTime,
          // Análise Estratégica
          strategicMatrix: matrixByQuadrant,
          bottlenecks,
          // Performance
          lowVolumeItems: lowVolumeItems.slice(0, 10),
          itemDelayRate,
          unavailableItems: unavailableWithHistory,
          // Análise de Preparo
          prepTimeByItem: itemsWithPrepTime,
          // Alertas
          alerts
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/menu/item/:id/metrics?start=...&end=...
  getMenuItemMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { start: startParam, end: endParam } = req.query;
      
      const start = startParam ? new Date(startParam as string) : (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      })();

      const end = endParam ? new Date(endParam as string) : new Date();

      // Verificar se o item existe
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          price: true,
          available: true,
          imageUrl: true,
          createdAt: true,
        }
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: 'Item do cardápio não encontrado'
        });
      }

      // Calcular período anterior para comparações
      const duration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - duration);
      const previousEnd = start;

      // === 1) MÉTRICAS GERAIS DO ITEM ===
      const salesData: any[] = await prisma.$queryRaw`
        SELECT 
          SUM(o.quantity) as "totalQuantity",
          SUM(o."totalPrice") as "totalRevenue",
          COUNT(DISTINCT o.id) as "ordersCount",
          COUNT(DISTINCT o."tabId") as "uniqueTabs",
          AVG(o.quantity) as "avgQuantityPerOrder"
        FROM orders o
        WHERE o."menuItemId" = ${id}
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
      `;

      const sales = salesData[0] || {};
      const totalQuantity = parseInt(sales.totalQuantity || 0);
      const totalRevenue = parseFloat(sales.totalRevenue || 0);
      const ordersCount = parseInt(sales.ordersCount || 0);
      const uniqueTabs = parseInt(sales.uniqueTabs || 0);
      const avgQuantityPerOrder = parseFloat(sales.avgQuantityPerOrder || 0);

      // === 2) COMPARAÇÃO COM PERÍODO ANTERIOR ===
      const previousSalesData: any[] = await prisma.$queryRaw`
        SELECT 
          SUM(o.quantity) as "totalQuantity",
          SUM(o."totalPrice") as "totalRevenue",
          COUNT(DISTINCT o.id) as "ordersCount"
        FROM orders o
        WHERE o."menuItemId" = ${id}
          AND o."createdAt" >= ${previousStart}
          AND o."createdAt" < ${previousEnd}
      `;

      const previousSales = previousSalesData[0] || {};
      const previousQuantity = parseInt(previousSales.totalQuantity || 0);
      const previousRevenue = parseFloat(previousSales.totalRevenue || 0);

      const quantityChange = previousQuantity > 0 
        ? ((totalQuantity - previousQuantity) / previousQuantity) * 100 
        : 0;
      const revenueChange = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // === 3) TEMPO DE PREPARO ===
      const prepTimeData: any[] = await prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60) as "avgPrepMinutes",
          MIN(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60) as "minPrepMinutes",
          MAX(EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60) as "maxPrepMinutes",
          COUNT(o.id) as "ordersWithTime"
        FROM orders o
        WHERE o."menuItemId" = ${id}
          AND o."sentToKitchenAt" IS NOT NULL 
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
      `;

      const prepTime = prepTimeData[0] || {};
      const avgPrepMinutes = parseFloat(prepTime.avgPrepMinutes || 0);
      const minPrepMinutes = parseFloat(prepTime.minPrepMinutes || 0);
      const maxPrepMinutes = parseFloat(prepTime.maxPrepMinutes || 0);

      // === 4) TAXA DE ATRASO ===
      const SLA_MINUTES = 20;
      const delayData: any[] = await prisma.$queryRaw`
        SELECT 
          COUNT(o.id) as "totalOrders",
          COUNT(o.id) FILTER (
            WHERE EXTRACT(EPOCH FROM (o."deliveredAt" - o."sentToKitchenAt"))/60 > ${SLA_MINUTES}
          ) as "delayedOrders"
        FROM orders o
        WHERE o."menuItemId" = ${id}
          AND o."sentToKitchenAt" IS NOT NULL 
          AND o."deliveredAt" IS NOT NULL
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
      `;

      const delay = delayData[0] || {};
      const totalOrdersWithTime = parseInt(delay.totalOrders || 0);
      const delayedOrders = parseInt(delay.delayedOrders || 0);
      const delayPercentage = totalOrdersWithTime > 0 
        ? (delayedOrders / totalOrdersWithTime) * 100 
        : 0;

      // === 5) DISTRIBUIÇÃO POR HORÁRIO ===
      const hourlyData: any[] = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM o."createdAt") as "hour",
          SUM(o.quantity) as "totalQuantity",
          SUM(o."totalPrice") as "totalRevenue",
          COUNT(o.id) as "ordersCount"
        FROM orders o
        WHERE o."menuItemId" = ${id}
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY "hour"
        ORDER BY "hour"
      `;

      const hourlyDistribution = hourlyData.map((h: any) => ({
        hour: parseInt(h.hour || 0),
        totalQuantity: parseInt(h.totalQuantity || 0),
        totalRevenue: parseFloat(h.totalRevenue || 0),
        ordersCount: parseInt(h.ordersCount || 0)
      }));

      // === 6) TENDÊNCIA DIÁRIA ===
      const dailyData: any[] = await prisma.$queryRaw`
        SELECT 
          DATE(o."createdAt") as "date",
          SUM(o.quantity) as "totalQuantity",
          SUM(o."totalPrice") as "totalRevenue",
          COUNT(o.id) as "ordersCount"
        FROM orders o
        WHERE o."menuItemId" = ${id}
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY "date"
        ORDER BY "date"
      `;

      const dailyTrend = dailyData.map((d: any) => ({
        date: d.date,
        totalQuantity: parseInt(d.totalQuantity || 0),
        totalRevenue: parseFloat(d.totalRevenue || 0),
        ordersCount: parseInt(d.ordersCount || 0)
      }));

      // === 7) RANKING DO ITEM (comparado com outros da mesma categoria) ===
      const categoryRanking: any[] = await prisma.$queryRaw`
        SELECT 
          mi.id as "itemId",
          mi.name as "itemName",
          SUM(o.quantity) as "totalQuantity",
          SUM(o."totalPrice") as "totalRevenue"
        FROM orders o
        JOIN menu_items mi ON o."menuItemId" = mi.id
        WHERE mi.category = ${menuItem.category}::"MenuCategory"
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
        GROUP BY mi.id, mi.name
        ORDER BY "totalRevenue" DESC
      `;

      const rankInCategory = categoryRanking.findIndex(i => i.itemId === id) + 1;
      const totalInCategory = categoryRanking.length;

      // === 8) TAXA DE CONVERSÃO (quantas comandas que tem pelo menos 1 pedido deste item) ===
      const totalTabsInPeriod = await prisma.tab.count({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });

      const conversionRate = totalTabsInPeriod > 0 
        ? (uniqueTabs / totalTabsInPeriod) * 100 
        : 0;

      // === RESPOSTA FINAL ===
      res.json({
        success: true,
        data: {
          item: {
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description,
            category: menuItem.category,
            price: parseFloat(menuItem.price.toString()),
            available: menuItem.available,
            imageUrl: menuItem.imageUrl,
            createdAt: menuItem.createdAt
          },
          metrics: {
            sales: {
              totalQuantity,
              totalRevenue,
              ordersCount,
              uniqueTabs,
              avgQuantityPerOrder,
              conversionRate
            },
            comparison: {
              previousQuantity,
              previousRevenue,
              quantityChange,
              revenueChange
            },
            prepTime: {
              avgPrepMinutes,
              minPrepMinutes,
              maxPrepMinutes,
              delayPercentage,
              delayedOrders,
              totalOrdersWithTime
            },
            ranking: {
              rankInCategory,
              totalInCategory,
              categoryName: menuItem.category
            },
            trends: {
              hourlyDistribution,
              dailyTrend
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}