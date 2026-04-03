'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat, Clock, CheckCircle2, AlertTriangle,
  Maximize, LogOut, RefreshCw, Play, UtensilsCrossed, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSSE } from '@/hooks/useSSE'
import { minutesAgo } from '@/lib/utils'
import type { Order, OrderItem, MenuItem, Table } from '@/generated/prisma/client'

type OrderItemWithMenu = OrderItem & { menuItem: MenuItem }
type OrderWithItems = Order & { items: OrderItemWithMenu[]; table: Table }

const OVERTIME_MINUTES = 15

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMenuPanel, setShowMenuPanel] = useState(false)
  const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string; isAvailable: boolean; categoryName: string }>>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?today=true')
      const result = await res.json()
      if (result.success) {
        setOrders(result.data.filter((o: OrderWithItems) =>
          !['COMPLETED', 'CANCELLED'].includes(o.status)
        ))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    audioRef.current = new Audio('/notification.mp3')
  }, [fetchOrders])

  useSSE('kitchen', useCallback((event: string) => {
    if (event === 'new-order') {
      fetchOrders()
      try { audioRef.current?.play() } catch { /* ignore */ }
      toast('新訂單！', { icon: '🔔', duration: 3000 })
    }
    if (event === 'order-updated') {
      fetchOrders()
    }
  }, [fetchOrders]))

  const updateItemStatus = async (orderId: string, itemId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchOrders()
  }

  const completeAllItems = async (order: OrderWithItems) => {
    await Promise.all(
      order.items
        .filter(i => i.status !== 'DONE')
        .map(i =>
          fetch(`/api/orders/${order.id}/items/${i.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DONE' }),
          })
        )
    )
    fetchOrders()
    toast.success(`桌號 ${order.table.number} 訂單已完成`)
  }

  const confirmOrder = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PREPARING' }),
    })
    fetchOrders()
  }

  const markServed = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SERVED' }),
    })
    fetchOrders()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const fetchMenuItems = async () => {
    const res = await fetch('/api/categories?all=true')
    const result = await res.json()
    if (result.success) {
      const items: typeof menuItems = []
      result.data.forEach((cat: { name: string; items: Array<{ id: string; name: string; isAvailable: boolean }> }) => {
        cat.items.forEach(item => {
          items.push({ id: item.id, name: item.name, isAvailable: item.isAvailable, categoryName: cat.name })
        })
      })
      setMenuItems(items)
    }
  }

  const toggleItemAvailability = async (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (!item) return
    const newVal = !item.isAvailable
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: newVal } : i))
    await fetch(`/api/menu-items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: newVal }),
    })
    toast.success(newVal ? `${item.name} 已上架` : `${item.name} 已下架`)
  }

  const openMenuPanel = () => {
    fetchMenuItems()
    setShowMenuPanel(true)
  }

  // Categorize orders into columns
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')
  const preparingOrders = orders.filter(o => o.status === 'PREPARING')
  const readyOrders = orders.filter(o => o.status === 'READY')

  // Auto refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  const OrderCard = ({ order, showActions }: { order: OrderWithItems; showActions: 'pending' | 'preparing' | 'ready' }) => {
    const mins = minutesAgo(new Date(order.createdAt))
    const isOvertime = mins >= OVERTIME_MINUTES

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-surface rounded-xl p-4 border-2 ${
          isOvertime ? 'border-danger animate-pulse' : 'border-surface-light'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-accent">#{order.table.number}</span>
            <span className="text-xs text-muted">#{order.orderNumber}</span>
          </div>
          <div className={`flex items-center gap-1 text-sm ${isOvertime ? 'text-danger font-bold' : 'text-muted'}`}>
            {isOvertime && <AlertTriangle className="w-4 h-4" />}
            <Clock className="w-4 h-4" />
            {mins} 分鐘
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {order.items.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                item.status === 'DONE' ? 'bg-success/10' : item.status === 'PREPARING' ? 'bg-blue-500/10' : 'bg-surface-light'
              }`}
            >
              <div className="flex-1">
                <span className={`text-lg font-medium ${item.status === 'DONE' ? 'line-through text-muted' : ''}`}>
                  {item.menuItem.name} <span className="text-accent font-bold">x{item.quantity}</span>
                </span>
                {item.note && (
                  <p className="text-sm text-amber-400 font-medium mt-0.5">*** {item.note}</p>
                )}
              </div>
              {showActions === 'preparing' && item.status !== 'DONE' && (
                <div className="flex gap-1 ml-2">
                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => updateItemStatus(order.id, item.id, 'PREPARING')}
                      className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                      title="開始製作"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {item.status === 'PREPARING' && (
                    <button
                      onClick={() => updateItemStatus(order.id, item.id, 'DONE')}
                      className="p-1.5 rounded-lg bg-success text-white hover:bg-green-600"
                      title="完成"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.customerNote && (
          <div className="mt-3 p-2 bg-amber-500/10 rounded-lg text-sm text-amber-400 font-medium">
            備註：{order.customerNote}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {showActions === 'pending' && (
            <button
              onClick={() => confirmOrder(order.id)}
              className="flex-1 py-2 rounded-lg bg-accent text-background font-bold text-sm hover:bg-accent-light"
            >
              接收訂單
            </button>
          )}
          {showActions === 'preparing' && (
            <button
              onClick={() => completeAllItems(order)}
              className="flex-1 py-2 rounded-lg bg-success text-white font-bold text-sm hover:bg-green-600"
            >
              全部完成
            </button>
          )}
          {showActions === 'ready' && (
            <button
              onClick={() => markServed(order.id)}
              className="flex-1 py-2 rounded-lg bg-accent text-background font-bold text-sm hover:bg-accent-light"
            >
              已出餐
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface border-b border-surface-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold text-accent">廚房 KDS</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openMenuPanel} className="p-2 rounded-full hover:bg-surface-light text-muted" title="菜品上下架">
            <UtensilsCrossed className="w-5 h-5" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-surface-light text-muted">
            <Maximize className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-surface-light text-muted">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Kanban Columns */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-[calc(100vh-60px)]">
        {/* Pending */}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            待處理 <span className="text-muted text-sm font-normal">({pendingOrders.length})</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            <AnimatePresence>
              {pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} showActions="pending" />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Preparing */}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            製作中 <span className="text-muted text-sm font-normal">({preparingOrders.length})</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            <AnimatePresence>
              {preparingOrders.map(order => (
                <OrderCard key={order.id} order={order} showActions="preparing" />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready */}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            待出餐 <span className="text-muted text-sm font-normal">({readyOrders.length})</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            <AnimatePresence>
              {readyOrders.map(order => (
                <OrderCard key={order.id} order={order} showActions="ready" />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Menu Availability Panel */}
      <AnimatePresence>
        {showMenuPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMenuPanel(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-surface z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-light">
                <h2 className="text-lg font-bold">菜品上下架</h2>
                <button onClick={() => setShowMenuPanel(false)} className="p-1 rounded-full hover:bg-surface-light">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-1 overflow-hidden">
                {/* Category quick nav - left sidebar */}
                <div className="flex flex-col gap-1 p-2 border-r border-surface-light overflow-y-auto no-scrollbar">
                  {(() => {
                    const cats = [...new Set(menuItems.map(i => i.categoryName))]
                    return cats.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          const el = document.getElementById(`kitchen-cat-${cat}`)
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className="flex-shrink-0 px-3 py-2.5 rounded-lg text-sm font-bold text-muted hover:text-accent hover:bg-accent/20 transition-colors whitespace-nowrap"
                      >
                        {cat}
                      </button>
                    ))
                  })()}
                </div>
                {/* Menu items list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                  const groups: Record<string, typeof menuItems> = {}
                  menuItems.forEach(item => {
                    if (!groups[item.categoryName]) groups[item.categoryName] = []
                    groups[item.categoryName].push(item)
                  })
                  return Object.entries(groups).map(([catName, items]) => (
                    <div key={catName} id={`kitchen-cat-${catName}`}>
                      <h3 className="text-sm font-medium text-muted mb-2">{catName}</h3>
                      <div className="space-y-1">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-light">
                            <span
                              className="font-medium text-sm transition-colors duration-500"
                              style={{ color: item.isAvailable ? 'var(--foreground)' : 'var(--muted)' }}
                            >
                              {item.name}
                            </span>
                            <button
                              onClick={() => toggleItemAvailability(item.id)}
                              className="flex-shrink-0 w-11 h-6 rounded-full flex items-center px-[3px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-90 border"
                              style={{
                                backgroundColor: item.isAvailable ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                                borderColor: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                              }}
                            >
                              <div
                                className="w-4 h-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{
                                  transform: item.isAvailable ? 'translateX(20px)' : 'translateX(0)',
                                  backgroundColor: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                                }}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
