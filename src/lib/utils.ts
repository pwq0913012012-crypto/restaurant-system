import { format } from 'date-fns'

export function generateOrderNumber(): string {
  const today = format(new Date(), 'yyyyMMdd')
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `${today}-${seq}`
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getSpicyLabel(level: number): string {
  const labels = ['不辣', '小辣', '中辣', '大辣']
  return labels[level] || '不辣'
}

export function getSpicyEmoji(level: number): string {
  if (level === 0) return ''
  return '🌶️'.repeat(level)
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待確認',
    CONFIRMED: '已確認',
    PREPARING: '準備中',
    READY: '待出餐',
    SERVED: '已送達',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return labels[status] || status
}

export function getOrderItemStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待處理',
    PREPARING: '製作中',
    DONE: '已完成',
  }
  return labels[status] || status
}

export function getTableStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: '空桌',
    OCCUPIED: '用餐中',
    RESERVED: '已預約',
    CLEANING: '清潔中',
  }
  return labels[status] || status
}

export function getTableStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-500',
    OCCUPIED: 'bg-amber-500',
    RESERVED: 'bg-blue-500',
    CLEANING: 'bg-gray-500',
  }
  return colors[status] || 'bg-gray-500'
}

export function minutesAgo(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000)
}
