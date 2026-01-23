import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_SERVICE_CHARGE_RATE } from '@resbar/shared';

export class TabController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId, type, personName } = req.body;

      // If tableId provided, create a table-linked tab; otherwise create counter tab
      const tab = await prisma.tab.create({
        data: {
          tableId: tableId || null,
          type: type || 'COUNTER',
          serviceChargeIncluded: false,
          serviceChargePaidSeparately: false,
        },
      });

      // Optionally create person linked to tab (for counter quick sale)
      if (personName) {
        await prisma.person.create({
          data: {
            name: personName,
            tabId: tab.id,
          },
        });
      }

      const result = await prisma.tab.findUnique({
        where: { id: tab.id },
        include: { person: true, orders: { include: { menuItem: true } } },
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { paymentMethod, paidAmount, serviceChargeIncluded = true, serviceChargePaidSeparately = false } = req.body;

      // Buscar a comanda com o total e tableId
      const existingTab = await prisma.tab.findUnique({
        where: { id },
        select: { total: true, status: true, tableId: true, serviceChargeIncluded: true },
      });

      if (!existingTab) {
        throw new AppError(404, 'Comanda não encontrada');
      }

      if (existingTab.status === 'CLOSED') {
        throw new AppError(400, 'Comanda já está fechada');
      }

      // Calcular taxa de serviço
      let serviceChargeAmount = 0;
      let finalTotal = existingTab.total;

      if (serviceChargeIncluded) {
        serviceChargeAmount = existingTab.total * DEFAULT_SERVICE_CHARGE_RATE;
        if (!serviceChargePaidSeparately) {
          finalTotal = existingTab.total + serviceChargeAmount;
        }
      }

      // Calcular troco (se pagamento em dinheiro)
      const changeAmount = paymentMethod === 'CASH' 
        ? Math.max(0, paidAmount - finalTotal)
        : 0;

      const tab = await prisma.tab.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          paidAt: new Date(),
          paymentMethod,
          paidAmount,
          changeAmount,
          serviceChargeIncluded,
          serviceChargePaidSeparately,
          serviceChargeAmount,
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

      // Verificar se todas as comandas da mesa foram pagas
      if (existingTab.tableId) {
        const openTabsCount = await prisma.tab.count({
          where: {
            tableId: existingTab.tableId,
            status: 'OPEN',
          },
        });

        // Se não há mais comandas abertas, atualizar status da mesa
        if (openTabsCount === 0) {
          await prisma.table.update({
            where: { id: existingTab.tableId },
            data: {
              status: 'PAID_PENDING_RELEASE',
              allTabsPaidAt: new Date(),
            },
          });
        }
      }

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
      const serviceCharge = subtotal * DEFAULT_SERVICE_CHARGE_RATE;
      const total = subtotal + (tab.serviceChargeIncluded && !tab.serviceChargePaidSeparately ? serviceCharge : 0);

      const calculation = {
        tabId: tab.id,
        personName: tab.person?.name || 'Sem nome',
        items: tab.orders,
        subtotal,
        serviceCharge,
        serviceChargeIncluded: tab.serviceChargeIncluded,
        serviceChargePaidSeparately: tab.serviceChargePaidSeparately,
        total,
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
        const serviceCharge = subtotal * DEFAULT_SERVICE_CHARGE_RATE;
        const total = subtotal + (tab.serviceChargeIncluded && !tab.serviceChargePaidSeparately ? serviceCharge : 0);
        
        return {
          tabId: tab.id,
          personName: tab.person?.name || 'Sem nome',
          items: tab.orders,
          subtotal,
          serviceCharge,
          serviceChargeIncluded: tab.serviceChargeIncluded,
          total,
        };
      });

      const grandTotal = tabCalculations.reduce((sum, calc) => sum + calc.total, 0);
      const totalServiceCharge = tabCalculations.reduce((sum, calc) => 
        sum + (calc.serviceChargeIncluded ? calc.serviceCharge : 0), 0);

      const calculation = {
        tableId: table.id,
        tableNumber: table.number,
        tabs: tabCalculations,
        totalServiceCharge,
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

  async toggleServiceCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { serviceChargeIncluded } = req.body;

      const tab = await prisma.tab.update({
        where: { id },
        data: { serviceChargeIncluded },
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

  async requestBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tab = await prisma.tab.update({
        where: { id },
        data: { requestedBillAt: new Date() },
      });

      res.json({
        success: true,
        data: tab,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tab = await prisma.tab.findUnique({ where: { id } });

      if (!tab) {
        throw new AppError(404, 'Comanda não encontrada');
      }

      // Delete related orders first
      await prisma.order.deleteMany({ where: { tabId: id } });

      // Delete related person if any
      await prisma.person.deleteMany({ where: { tabId: id } });

      // Finally delete the tab
      await prisma.tab.delete({ where: { id } });

      // If tab was linked to a table, check if we should update table status
      if (tab.tableId) {
        const openTabsCount = await prisma.tab.count({ where: { tableId: tab.tableId, status: 'OPEN' } });
        if (openTabsCount === 0) {
          await prisma.table.update({ where: { id: tab.tableId }, data: { status: 'AVAILABLE' } });
        }
      }

      res.json({ success: true, message: 'Comanda excluída com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}
