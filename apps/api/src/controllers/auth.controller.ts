import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { UserRole, type LoginResponseDTO, type UserDTO } from '@resbar/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// Helper para gerar tokens
function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  return { accessToken, refreshToken };
}

// Helper para converter User do Prisma para UserDTO
function userToDTO(user: any): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    birthdate: user.birthdate,
    gender: user.gender,
    customGender: user.customGender,
    role: user.role,
    googleId: user.googleId,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// POST /api/auth/google - Callback do Google OAuth
export async function googleCallback(req: Request, res: Response) {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Google ID e email são obrigatórios',
      });
    }

    // Procura usuário existente por googleId ou email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    let needsProfileCompletion = false;

    // Se não existe, cria novo usuário
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          avatar,
          role: UserRole.STANDARD,
        },
      });
      needsProfileCompletion = true;
    } else if (!user.googleId) {
      // Se existe por email mas não tem googleId, atualiza
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: avatar || user.avatar },
      });
    }

    // Verifica se o perfil está completo
    if (!user.birthdate || !user.gender) {
      needsProfileCompletion = true;
    }

    // Gera tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Define refresh token como httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    });

    const response: LoginResponseDTO & { needsProfileCompletion: boolean } = {
      user: userToDTO(user),
      accessToken,
      needsProfileCompletion,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Erro no callback do Google:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar autenticação',
    });
  }
}

// POST /api/auth/complete-profile - Completar perfil após login
export async function completeProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    console.log('Complete profile - User ID:', userId);
    console.log('Complete profile - Body:', req.body);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    const { name, birthdate, gender, customGender } = req.body;

    if (!name || !birthdate || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Nome, data de nascimento e gênero são obrigatórios',
      });
    }

    console.log('Updating user with data:', { name, birthdate, gender, customGender });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        birthdate: new Date(birthdate),
        gender,
        customGender: gender === 'OTHER' ? customGender : null,
      },
    });

    console.log('User updated successfully:', user.id);

    res.json({
      success: true,
      data: userToDTO(user),
    });
  } catch (error) {
    console.error('Erro ao completar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar perfil',
    });
  }
}

// GET /api/auth/me - Obter dados do usuário autenticado
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      data: userToDTO(user),
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuário',
    });
  }
}

// POST /api/auth/refresh - Renovar access token usando refresh token
export async function refreshAccessToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token não fornecido',
      });
    }

    // Verifica o refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };

    // Gera novo access token
    const { accessToken } = generateTokens(decoded.userId);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(401).json({
      success: false,
      error: 'Refresh token inválido ou expirado',
    });
  }
}

// POST /api/auth/logout - Fazer logout
export async function logout(_req: Request, res: Response) {
  try {
    // Remove o refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer logout',
    });
  }
}
