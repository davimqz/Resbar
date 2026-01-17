import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class TabController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tabs = await prisma.tab.findMany({
        include: {
          person: true,
          table: true,
          orders: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: tabs,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tab = await prisma.tab.findUnique({
        where: { id },
        include: {
          person: true,
          table: true,
          orders: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (!tab) {
        throw new AppError(404, 'Comanda não encontrada');
      }

      res.json({
        success: true,
        data: tab,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByTableId(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;

      const tabs = await prisma.tab.findMany({
        where: { tableId, status: 'OPEN' },
        include: {
          person: true,
          orders: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: tabs,
      });
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { paymentMethod, paidAmount } = req.body;

      // Buscar a comanda com o total
      const existingTab = await prisma.tab.findUnique({
        where: { id },
        select: { total: true, status: true },
      });

      if (!existingTab) {
        throw new AppError(404, 'Comanda não encontrada');
      }

      if (existingTab.status === 'CLOSED') {
        throw new AppError(400, 'Comanda já está fechada');
      }

      // Calcular troco (se pagamento em dinheiro)
      const changeAmount = paymentMethod === 'CASH' 
        ? Math.max(0, paidAmount - existingTab.total)
        : 0;

      const tab = await prisma.tab.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          paymentMethod,
          paidAmount,
          changeAmount,
        },
        include: {
          person: true,
          orders: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: tab,
      });
    } catch (error) {
      next(error);
    }
  }

  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tab = await prisma.tab.findUnique({
        where: { id },
        include: {
          person: true,
          orders: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (!tab) {
        throw new AppError(404, 'Comanda não encontrada');
      }

      const subtotal = tab.orders.reduce((sum, order) => sum + order.totalPrice, 0);

      const calculation = {
        tabId: tab.id,
        personName: tab.person?.name || 'Sem nome',
        items: tab.orders,
        subtotal,
        total: subtotal,
      };

      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      next(error);
    }
  }

  async calculateTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;

      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          tabs: {
            where: { status: 'OPEN' },
            include: {
              person: true,
              orders: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      });

      if (!table) {
        throw new AppError(404, 'Mesa não encontrada');
      }

      const tabCalculations = table.tabs.map((tab) => {
        const subtotal = tab.orders.reduce((sum, order) => sum + order.totalPrice, 0);
        return {
          tabId: tab.id,
          personName: tab.person?.name || 'Sem nome',
          items: tab.orders,
          subtotal,
          total: subtotal,
        };
      });

      const grandTotal = tabCalculations.reduce((sum, calc) => sum + calc.total, 0);

      const calculation = {
        tableId: table.id,
        tableNumber: table.number,
        tabs: tabCalculations,
        grandTotal,
      };

      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      next(error);
    }
  }
}
