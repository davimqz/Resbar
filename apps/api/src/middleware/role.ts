import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@resbar/shared';
import { AuthRequest } from './auth.js';

// Middleware para verificar roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Você não tem permissão para esta ação.',
      });
    }

    next();
  };
}

// Atalhos para roles específicas
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireWaiter = requireRole(UserRole.WAITER, UserRole.ADMIN);
export const requireKitchen = requireRole(UserRole.KITCHEN, UserRole.ADMIN);
export const requireStaff = requireRole(
  UserRole.WAITER,
  UserRole.KITCHEN,
  UserRole.ADMIN
);
