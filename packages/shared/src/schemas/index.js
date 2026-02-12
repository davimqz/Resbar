import { z } from 'zod';
import { TableStatus, OrderStatus, MenuCategory, PaymentMethod } from '../types/index.js';
// Waiter schemas
export const createWaiterSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    active: z.boolean().optional().default(true),
});
export const updateWaiterSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    active: z.boolean().optional(),
});
// Table schemas
export const createTableSchema = z.object({
    number: z.number().int().positive('Número da mesa deve ser positivo'),
    location: z.string().optional(),
    capacity: z.number().int().positive().optional().default(4),
    waiterId: z.string().optional(),
});
export const updateTableSchema = z.object({
    number: z.number().int().positive('Número da mesa deve ser positivo').optional(),
    location: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    status: z.nativeEnum(TableStatus).optional(),
    waiterId: z.string().nullable().optional(),
});
// Person schemas
export const createPersonSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    tableId: z.string(),
});
// Order schemas
export const createOrderSchema = z.object({
    tabId: z.string(),
    menuItemId: z.string(),
    quantity: z.number().int().positive('Quantidade deve ser positiva').default(1),
    notes: z.string().optional(),
});
export const updateOrderSchema = z.object({
    quantity: z.number().int().positive('Quantidade deve ser positiva').optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    notes: z.string().optional(),
});
// MenuItem schemas
export const createMenuItemSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    description: z.string().optional(),
    price: z.number().positive('Preço deve ser positivo'),
    category: z.nativeEnum(MenuCategory),
    available: z.boolean().optional().default(true),
    imageUrl: z.string().url('URL inválida').optional(),
    allergens: z.array(z.string()).optional(),
});
export const updateMenuItemSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    description: z.string().optional(),
    price: z.number().positive('Preço deve ser positivo').optional(),
    category: z.nativeEnum(MenuCategory).optional(),
    available: z.boolean().optional(),
    imageUrl: z.string().url('URL inválida').optional(),
    allergens: z.array(z.string()).optional(),
});
// Query schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export const idParamSchema = z.object({
    id: z.string(),
});
// Payment schemas
export const closeTabSchema = z.object({
    body: z.object({
        paymentMethod: z.nativeEnum(PaymentMethod),
        paidAmount: z.number().positive('Valor pago deve ser positivo'),
    }),
});
