import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { ReturnCategory, ReturnRequestStatus } from '@resbar/shared';
import { RETURN_SUBCATEGORIES } from '@resbar/shared';
import { AuthRequest } from '../middleware/auth.js';

// Schemas de validação
const createReturnRequestSchema = z.object({
  orderId: z.string(),
  category: z.nativeEnum(ReturnCategory),
  subcategory: z.string(),
  description: z.string().optional(),
  sourceType: z.enum(['COMANDA', 'MESA']).optional(),
  sourceId: z.string().optional(),
  imageUrl: z.string().optional(),
});

const updateReturnRequestSchema = z.object({
  status: z.nativeEnum(ReturnRequestStatus).optional(),
  resolvedById: z.string().optional(),
  sourceType: z.enum(['COMANDA', 'MESA']).optional(),
  sourceId: z.string().optional(),
});

// Validação de subcategoria
function validateSubcategory(category: ReturnCategory, subcategory: string): boolean {
  const validSubcategories = RETURN_SUBCATEGORIES[category] as readonly string[];
  return (validSubcategories as string[]).includes(subcategory);
}

export class ReturnRequestController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const returnRequests = await prisma.returnRequest.findMany({
        include: {
          order: {
            include: {
              menuItem: true,
              tab: {
                include: {
                  person: true,
                  table: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: returnRequests,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              menuItem: true,
              tab: {
                include: {
                  person: true,
                  table: true,
                },
              },
            },
          },
        },
      });

      if (!returnRequest) {
        throw new AppError(404, 'Solicitação de devolução não encontrada');
      }

      res.json({
        success: true,
        data: returnRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;

      const returnRequests = await prisma.returnRequest.findMany({
        where: { orderId },
        include: {
          order: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: returnRequests,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const data = createReturnRequestSchema.parse(req.body);

      // Validar subcategoria
      if (!validateSubcategory(data.category, data.subcategory)) {
        throw new AppError(400, 'Subcategoria inválida para a categoria selecionada');
      }

      // Verificar se o pedido existe
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
      });

      if (!order) {
        throw new AppError(404, 'Pedido não encontrado');
      }

      // Criar a solicitação de devolução
      const returnRequest = await prisma.returnRequest.create({
        data: {
          orderId: data.orderId,
          category: data.category,
          subcategory: data.subcategory,
          description: data.description || null,
          sourceType: data.sourceType || null,
          sourceId: data.sourceId || null,
          imageUrl: data.imageUrl || null,
          createdById: authReq.user!.id, // ID do usuário autenticado
          status: ReturnRequestStatus.PENDING,
        },
        include: {
          order: {
            include: {
              menuItem: true,
              tab: {
                include: {
                  person: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: returnRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const data = updateReturnRequestSchema.parse(req.body);

      // Verificar se a solicitação existe
      const existingRequest = await prisma.returnRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        throw new AppError(404, 'Solicitação de devolução não encontrada');
      }

      // Atualizar a solicitação
      const updateData: any = {};

      if (data.status) {
        updateData.status = data.status;
        
        // Se está sendo resolvida, marcar o timestamp
        if (data.status !== ReturnRequestStatus.PENDING && !existingRequest.resolvedAt) {
          updateData.resolvedAt = new Date();
          updateData.resolvedById = authReq.user!.id;
        }
      }

      if (data.resolvedById) {
        updateData.resolvedById = data.resolvedById;
      }

      if (data.sourceType) updateData.sourceType = data.sourceType;
      if (data.sourceId) updateData.sourceId = data.sourceId;

      const returnRequest = await prisma.returnRequest.update({
        where: { id },
        data: updateData,
        include: {
          order: {
            include: {
              menuItem: true,
              tab: {
                include: {
                  person: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: returnRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id },
      });

      if (!returnRequest) {
        throw new AppError(404, 'Solicitação de devolução não encontrada');
      }

      await prisma.returnRequest.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Solicitação de devolução excluída com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
