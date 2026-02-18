import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { TabCancellationCategory, TabCancellationRequestStatus } from '@resbar/shared';
import { AuthRequest } from '../middleware/auth.js';

// Schemas de validação
const createTabCancellationRequestSchema = z.object({
  tabId: z.string(),
  category: z.nativeEnum(TabCancellationCategory),
  reason: z.string().optional(),
});

const updateTabCancellationRequestSchema = z.object({
  status: z.nativeEnum(TabCancellationRequestStatus).optional(),
  approvedByUserId: z.string().optional(),
});

export class TabCancellationController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await prisma.tabCancellationRequest.findMany({
        include: {
          tab: {
            include: {
              person: true,
              table: true,
              orders: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const request = await prisma.tabCancellationRequest.findUnique({
        where: { id },
        include: {
          tab: {
            include: {
              person: true,
              table: true,
              orders: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      });

      if (!request) {
        throw new AppError(404, 'Solicitação de cancelamento não encontrada');
      }

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByTabId(req: Request, res: Response, next: NextFunction) {
    try {
      const { tabId } = req.params;

      const requests = await prisma.tabCancellationRequest.findMany({
        where: { tabId },
        include: {
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
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const data = createTabCancellationRequestSchema.parse(req.body);

      // Verificar se a comanda existe
      const tab = await prisma.tab.findUnique({
        where: { id: data.tabId },
        include: {
          orders: true,
        },
      });

      if (!tab) {
        throw new AppError(404, 'Comanda não encontrada');
      }

      // Verificar se a comanda já está fechada ou cancelada
      if (tab.status === 'CLOSED') {
        throw new AppError(400, 'Não é possível cancelar uma comanda já fechada');
      }

      if (tab.status === 'CANCELLED') {
        throw new AppError(400, 'A comanda já está cancelada');
      }

      // Verificar se já existe uma solicitação pendente para esta comanda
      const existingPendingRequest = await prisma.tabCancellationRequest.findFirst({
        where: {
          tabId: data.tabId,
          status: TabCancellationRequestStatus.PENDING,
        },
      });

      if (existingPendingRequest) {
        throw new AppError(400, 'Já existe uma solicitação de cancelamento pendente para esta comanda');
      }

      // Criar a solicitação de cancelamento
      const request = await prisma.tabCancellationRequest.create({
        data: {
          tabId: data.tabId,
          category: data.category,
          reason: data.reason || null,
          requestedByUserId: authReq.user!.id,
          status: TabCancellationRequestStatus.PENDING,
        },
        include: {
          tab: {
            include: {
              person: true,
              table: true,
              orders: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const data = updateTabCancellationRequestSchema.parse(req.body);

      // Verificar se a solicitação existe
      const existingRequest = await prisma.tabCancellationRequest.findUnique({
        where: { id },
        include: {
          tab: true,
        },
      });

      if (!existingRequest) {
        throw new AppError(404, 'Solicitação de cancelamento não encontrada');
      }

      // Atualizar a solicitação
      const updateData: any = {};

      if (data.status) {
        updateData.status = data.status;

        // Se está sendo resolvida (aprovada ou rejeitada), marcar o timestamp
        if (data.status !== TabCancellationRequestStatus.PENDING && !existingRequest.resolvedAt) {
          updateData.resolvedAt = new Date();
          updateData.approvedByUserId = authReq.user!.id;
        }

        // Se aprovada, cancelar a comanda
        if (data.status === TabCancellationRequestStatus.APPROVED) {
          await prisma.tab.update({
            where: { id: existingRequest.tabId },
            data: {
              status: 'CANCELLED',
              closedAt: new Date(),
            },
          });

          // Atualizar status da mesa se necessário
          if (existingRequest.tab.tableId) {
            const openTabsCount = await prisma.tab.count({
              where: {
                tableId: existingRequest.tab.tableId,
                status: 'OPEN',
              },
            });

            if (openTabsCount === 0) {
              await prisma.table.update({
                where: { id: existingRequest.tab.tableId },
                data: { status: 'AVAILABLE' },
              });
            }
          }
        }
      }

      const request = await prisma.tabCancellationRequest.update({
        where: { id },
        data: updateData,
        include: {
          tab: {
            include: {
              person: true,
              table: true,
              orders: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const request = await prisma.tabCancellationRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new AppError(404, 'Solicitação de cancelamento não encontrada');
      }

      await prisma.tabCancellationRequest.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Solicitação de cancelamento excluída com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
