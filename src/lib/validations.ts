import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, '請輸入帳號'),
  password: z.string().min(1, '請輸入密碼'),
})

export const createUserSchema = z.object({
  name: z.string().min(1, '請輸入名稱'),
  email: z.string().min(1, '請輸入帳號'),
  password: z.string().min(1, '請輸入密碼'),
  role: z.enum(['ADMIN', 'WAITER', 'KITCHEN']),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'WAITER', 'KITCHEN']).optional(),
  isActive: z.boolean().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, '請輸入分類名稱'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const menuItemSchema = z.object({
  categoryId: z.string().min(1, '請選擇分類'),
  name: z.string().min(1, '請輸入菜品名稱'),
  description: z.string().default(''),
  price: z.number().positive('價格必須大於0'),
  image: z.string().default(''),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  spicyLevel: z.number().int().min(0).max(3).default(0),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
})

export const tableSchema = z.object({
  number: z.number().int().positive('桌號必須大於0'),
  seats: z.number().int().positive('座位數必須大於0').default(4),
  zone: z.string().default('A區'),
})

export const createOrderSchema = z.object({
  tableId: z.string().min(1),
  customerNote: z.string().default(''),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().positive(),
    note: z.string().default(''),
  })).min(1, '至少需要一個品項'),
})

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'DONE']),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
})

export const paymentSchema = z.object({
  orderId: z.string().min(1),
  method: z.enum(['CASH', 'CARD', 'MOBILE']),
  amount: z.number().positive(),
})

export const tablePaymentSchema = z.object({
  tableId: z.string().min(1),
  method: z.enum(['CASH', 'CARD', 'MOBILE']),
})
