import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createPersonSchema } from '@resbar/shared';
import { AppError } from '../middleware/errorHandler.js';

export class PersonController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPersonSchema.parse(req.body);

      // Verificar se a mesa existe
      const table = await prisma.table.findUnique({
        where: { id: data.tableId },
      });

      if (!table) {
        throw new AppError(404, 'Mesa não encontrada');
      }

      // Criar tab para a pessoa com timestamp de quando cliente sentou
      const tab = await prisma.tab.create({
        data: {
          tableId: data.tableId,
          customerSeatedAt: new Date(), // Set timestamp when customer is seated
          serviceChargeIncluded: false,
          serviceChargePaidSeparately: false,
        },
      });

      // Criar pessoa vinculada à tab
      const person = await prisma.person.create({
        data: {
          name: data.name,
          tabId: tab.id,
        },
        include: {
          tab: true,
        },
      });

      // Atualizar status da mesa para OCCUPIED
      await prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });

      res.status(201).json({
        success: true,
        data: person,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const person = await prisma.person.findUnique({
        where: { id },
        include: {
          tab: {
            include: {
              orders: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      });

      if (!person) {
        throw new AppError(404, 'Pessoa não encontrada');
      }

      res.json({
        success: true,
        data: person,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const person = await prisma.person.findUnique({
        where: { id },
        include: { tab: true },
      });

      if (!person) {
        throw new AppError(404, 'Pessoa não encontrada');
      }

      // Deletar pessoa (cascade irá deletar a tab)
      await prisma.person.delete({
        where: { id },
      });

      // Verificar se ainda há pessoas na mesa
      const remainingTabs = await prisma.tab.count({
        where: {
          tableId: person.tab.tableId,
          status: 'OPEN',
        },
      });

      // Se não houver mais pessoas, atualizar status da mesa
      if (remainingTabs === 0) {
        await prisma.table.update({
          where: { id: person.tab.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      res.json({
        success: true,
        message: 'Pessoa removida com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
