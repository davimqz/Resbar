import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createMenuItemSchema, updateMenuItemSchema } from '@resbar/shared';
import { AppError } from '../middleware/errorHandler.js';

export class MenuItemController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, available } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (available !== undefined) where.available = available === 'true';

      const menuItems = await prisma.menuItem.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: menuItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
      });

      if (!menuItem) {
        throw new AppError(404, 'Item do cardápio não encontrado');
      }

      res.json({
        success: true,
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMenuItemSchema.parse(req.body);

      const menuItem = await prisma.menuItem.create({
        data,
      });

      res.status(201).json({
        success: true,
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateMenuItemSchema.parse(req.body);

      const menuItem = await prisma.menuItem.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.menuItem.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Item do cardápio removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
      });

      if (!menuItem) {
        throw new AppError(404, 'Item do cardápio não encontrado');
      }

      const updated = await prisma.menuItem.update({
        where: { id },
        data: { available: !menuItem.available },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
