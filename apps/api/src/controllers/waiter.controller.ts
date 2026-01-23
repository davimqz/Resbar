import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createWaiterSchema, updateWaiterSchema, WAITER_BREAK_DURATION_MS } from '@resbar/shared';
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

  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const waiter = await prisma.waiter.findUnique({
        where: { id },
      });

      if (!waiter) {
        throw new AppError(404, 'Garçom não encontrado');
      }

      if (waiter.clockedInAt && !waiter.clockedOutAt) {
        throw new AppError(400, 'Garçom já está em turno');
      }

      const updatedWaiter = await prisma.waiter.update({
        where: { id },
        data: {
          clockedInAt: new Date(),
          clockedOutAt: null,
          onBreak: false,
          breakStartedAt: null,
        },
      });

      res.json({
        success: true,
        data: updatedWaiter,
      });
    } catch (error) {
      next(error);
    }
  }

  async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const waiter = await prisma.waiter.findUnique({
        where: { id },
      });

      if (!waiter) {
        throw new AppError(404, 'Garçom não encontrado');
      }

      if (!waiter.clockedInAt || waiter.clockedOutAt) {
        throw new AppError(400, 'Garçom não está em turno');
      }

      const updatedWaiter = await prisma.waiter.update({
        where: { id },
        data: {
          clockedOutAt: new Date(),
          onBreak: false,
          breakStartedAt: null,
        },
      });

      res.json({
        success: true,
        data: updatedWaiter,
      });
    } catch (error) {
      next(error);
    }
  }

  async startBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const waiter = await prisma.waiter.findUnique({
        where: { id },
      });

      if (!waiter) {
        throw new AppError(404, 'Garçom não encontrado');
      }

      if (!waiter.clockedInAt || waiter.clockedOutAt) {
        throw new AppError(400, 'Garçom precisa estar em turno para fazer intervalo');
      }

      if (waiter.onBreak) {
        throw new AppError(400, 'Garçom já está em intervalo');
      }

      const updatedWaiter = await prisma.waiter.update({
        where: { id },
        data: {
          onBreak: true,
          breakStartedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedWaiter,
        message: `Intervalo iniciado. Duração: ${WAITER_BREAK_DURATION_MS / 60000} minutos`,
      });
    } catch (error) {
      next(error);
    }
  }

  async endBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const waiter = await prisma.waiter.findUnique({
        where: { id },
      });

      if (!waiter) {
        throw new AppError(404, 'Garçom não encontrado');
      }

      if (!waiter.onBreak) {
        throw new AppError(400, 'Garçom não está em intervalo');
      }

      const updatedWaiter = await prisma.waiter.update({
        where: { id },
        data: {
          onBreak: false,
          breakStartedAt: null,
        },
      });

      res.json({
        success: true,
        data: updatedWaiter,
        message: 'Intervalo finalizado',
      });
    } catch (error) {
      next(error);
    }
  }
}
