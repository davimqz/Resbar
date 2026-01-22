import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

// Controller placeholder para inventário (mockup)
export class InventoryController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await prisma.inventoryItem.findMany({
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const item = await prisma.inventoryItem.findUnique({
        where: { id },
      });

      if (!item) {
        throw new AppError(404, 'Item não encontrado');
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, quantity, unit, minStock, category } = req.body;

      const item = await prisma.inventoryItem.create({
        data: {
          name,
          quantity: quantity || 0,
          unit,
          minStock: minStock || 0,
          category,
        },
      });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, quantity, unit, minStock, category } = req.body;

      const item = await prisma.inventoryItem.update({
        where: { id },
        data: {
          name,
          quantity,
          unit,
          minStock,
          category,
        },
      });

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.inventoryItem.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Item removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
