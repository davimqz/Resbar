import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createWaiterSchema, updateWaiterSchema } from '@resbar/shared';
import { AppError } from '../middleware/errorHandler.js';

export class WaiterController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const waiters = await prisma.waiter.findMany({
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: waiters,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const waiter = await prisma.waiter.findUnique({
        where: { id },
        include: {
          tables: true,
        },
      });

      if (!waiter) {
        throw new AppError(404, 'Garçom não encontrado');
      }

      res.json({
        success: true,
        data: waiter,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createWaiterSchema.parse(req.body);

      const waiter = await prisma.waiter.create({
        data,
      });

      res.status(201).json({
        success: true,
        data: waiter,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateWaiterSchema.parse(req.body);

      const waiter = await prisma.waiter.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        data: waiter,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.waiter.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Garçom removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
