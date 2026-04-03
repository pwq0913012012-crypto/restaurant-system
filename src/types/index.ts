import type {
  Category,
  MenuItem,
  Table,
  Order,
  OrderItem,
  Payment,
  User,
} from '@/generated/prisma/client'

export type CategoryWithItems = Category & {
  items: MenuItem[]
}

export type OrderItemWithMenu = OrderItem & {
  menuItem: MenuItem
}

export type OrderWithItems = Order & {
  items: OrderItemWithMenu[]
  table: Table
  payment: Payment | null
}

export type TableWithOrders = Table & {
  orders: OrderWithItems[]
}

export type SafeUser = Omit<User, 'password'>

export type CartItem = {
  menuItem: MenuItem
  quantity: number
  note: string
}

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}
