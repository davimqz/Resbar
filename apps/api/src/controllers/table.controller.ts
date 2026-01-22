import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createTableSchema, updateTableSchema, TableStatus } from '@resbar/shared';
import { AppError } from '../middleware/errorHandler.js';

export class TableController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const tables = await prisma.table.findMany({
        include: {
          waiter: true,
          tabs: {
            where: { status: 'OPEN' },
            include: {
              person: true,
            },
          },
        },
        orderBy: { number: 'asc' },
      });

      res.json({
        success: true,
        data: tables,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const table = await prisma.table.findUnique({
        where: { id },
        include: {
          waiter: true,
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

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTableSchema.parse(req.body);

      // Check if table number already exists
      const existing = await prisma.table.findUnique({
        where: { number: data.number },
      });

      if (existing) {
        throw new AppError(400, 'Já existe uma mesa com este número');
      }

      const table = await prisma.table.create({
        data,
        include: {
          waiter: true,
        },
      });

      res.status(201).json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateTableSchema.parse(req.body);

      const table = await prisma.table.update({
        where: { id },
        data,
        include: {
          waiter: true,
        },
      });

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.table.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Mesa removida com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(TableStatus).includes(status)) {
        throw new AppError(400, 'Status inválido');
      }

      // Se a mesa está sendo liberada (AVAILABLE), fechar todas as comandas abertas
      if (status === TableStatus.AVAILABLE) {
        await prisma.tab.updateMany({
          where: {
            tableId: id,
            status: 'OPEN',
          },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
          },
        });
      }

      const table = await prisma.table.update({
        where: { id },
        data: { status },
        include: {
          waiter: true,
        },
      });

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignWaiter(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { waiterId } = req.body;

      const table = await prisma.table.update({
        where: { id },
        data: { waiterId },
        include: {
          waiter: true,
        },
      });

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  // Liberar mesa (garçom confirma que mesa está livre)
  async releaseTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Verifica se a mesa existe e está em estado PAID_PENDING_RELEASE
      const table = await prisma.table.findUnique({
        where: { id },
        include: {
          tabs: {
            where: { status: 'OPEN' },
          },
        },
      });

      if (!table) {
        throw new AppError(404, 'Mesa não encontrada');
      }

      if (table.tabs.length > 0) {
        throw new AppError(400, 'Ainda existem comandas abertas nesta mesa');
      }

      // Libera a mesa e marca timestamp
      const updatedTable = await prisma.table.update({
        where: { id },
        data: {
          status: TableStatus.AVAILABLE,
          releasedAt: new Date(),
          allTabsPaidAt: null, // Reset para próximo uso
        },
        include: {
          waiter: true,
        },
      });

      res.json({
        success: true,
        data: updatedTable,
        message: 'Mesa liberada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
