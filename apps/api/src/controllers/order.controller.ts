import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createOrderSchema, updateOrderSchema, OrderStatus } from '@resbar/shared';
import { AppError } from '../middleware/errorHandler.js';

// Helper function
async function updateTabTotal(tabId: string) {
  const orders = await prisma.order.findMany({
    where: { tabId },
  });

  const total = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  await prisma.tab.update({
    where: { id: tabId },
    data: { total },
  });
}

export class OrderController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          menuItem: true,
          tab: {
            include: {
              person: true,
              table: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          menuItem: true,
          tab: {
            include: {
              person: true,
              table: true,
            },
          },
        },
      });

      if (!order) {
        throw new AppError(404, 'Pedido não encontrado');
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);

      // Buscar o item do cardápio para obter o preço
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: data.menuItemId },
      });

      if (!menuItem) {
        throw new AppError(404, 'Item do cardápio não encontrado');
      }

      if (!menuItem.available) {
        throw new AppError(400, 'Item do cardápio não está disponível');
      }

      // Criar o pedido
      const totalPrice = menuItem.price * data.quantity;

      const order = await prisma.order.create({
        data: {
          tabId: data.tabId,
          menuItemId: data.menuItemId,
          quantity: data.quantity,
          unitPrice: menuItem.price,
          totalPrice,
          notes: data.notes,
        },
        include: {
          menuItem: true,
          tab: {
            include: {
              person: true,
            },
          },
        },
      });

      // Atualizar total da comanda
      await updateTabTotal(data.tabId);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateOrderSchema.parse(req.body);

      const existingOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw new AppError(404, 'Pedido não encontrado');
      }

      // Recalcular total se a quantidade mudou
      let updateData: any = { ...data };
      if (data.quantity) {
        updateData.totalPrice = existingOrder.unitPrice * data.quantity;
      }

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          menuItem: true,
          tab: {
            include: {
              person: true,
            },
          },
        },
      });

      // Atualizar total da comanda
      await updateTabTotal(order.tabId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(OrderStatus).includes(status)) {
        throw new AppError(400, 'Status inválido');
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          menuItem: true,
          tab: {
            include: {
              person: true,
              table: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new AppError(404, 'Pedido não encontrado');
      }

      await prisma.order.delete({
        where: { id },
      });

      // Atualizar total da comanda
      await updateTabTotal(order.tabId);

      res.json({
        success: true,
        message: 'Pedido removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  async getKitchenOrders(_req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'PREPARING', 'READY'],
          },
        },
        include: {
          menuItem: true,
          tab: {
            include: {
              person: true,
              table: {
                include: {
                  waiter: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
}
