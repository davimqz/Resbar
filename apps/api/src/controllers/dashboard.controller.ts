import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import type { DashboardStatsDTO } from '@resbar/shared';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
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

      const tableIds = waiterStats.map(stat => stat.tableId);
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

      const stats: DashboardStatsDTO = {
        dailyRevenue,
        ordersCount,
        tablesOccupied,
        popularItems,
        waiterPerformance,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
