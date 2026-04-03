'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingCart, X, Plus, Minus, Trash2, Bell, ChefHat, Clock, CheckCircle2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import { useSSE } from '@/hooks/useSSE'
import { formatPrice, getSpicyEmoji, getOrderItemStatusLabel } from '@/lib/utils'
import type { Table, Category, MenuItem, Order, OrderItem } from '@/generated/prisma/client'

type CategoryWithItems = Category & { items: MenuItem[] }
type OrderItemWithMenu = OrderItem & { menuItem: MenuItem }
type OrderWithItems = Order & { items: OrderItemWithMenu[] }

interface Props {
  table: Table
  categories: CategoryWithItems[]
  existingOrders: OrderWithItems[]
}

export default function OrderClient({ table, categories, existingOrders }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showOrderTracker, setShowOrderTracker] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [orders, setOrders] = useState<OrderWithItems[]>(existingOrders)
  const [submitting, setSubmitting] = useState(false)
  const categoryNavRef = useRef<HTMLDivElement>(null)

  const cart = useCart()

  // SSE for real-time order updates
  useSSE(`table-${table.number}`, useCallback((event: string, data: unknown) => {
    if (event === 'order-updated') {
      const updated = data as OrderWithItems
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    }
  }, []))

  const filteredItems = searchQuery
    ? categories.flatMap(c => c.items).filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories.find(c => c.id === activeCategory)?.items || []

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table.id,
          customerNote: orderNote,
          items: cart.items.map(i => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            note: i.note,
          })),
        }),
      })
      const result = await res.json()
      if (result.success) {
        setOrders(prev => [result.data, ...prev])
        cart.clearCart()
        setOrderNote('')
        setShowCart(false)
        toast.success(`訂單已送出！ 訂單編號：${result.data.orderNumber}`)
      } else {
        toast.error(result.error || '送出訂單失敗')
      }
    } catch {
      toast.error('網路錯誤，請重試')
    } finally {
      setSubmitting(false)
    }
  }

  const handleServiceCall = async () => {
    try {
      const res = await fetch('/api/service-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: table.id }),
      })
      const result = await res.json()
      if (result.success) toast.success('已呼叫服務生，請稍候！')
    } catch {
      toast.error('呼叫失敗，請重試')
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-amber-400" />
      case 'PREPARING': return <ChefHat className="w-4 h-4 text-blue-400" />
      case 'DONE': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      default: return <Clock className="w-4 h-4 text-muted" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-surface-light px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-accent font-bold text-lg">{process.env.NEXT_PUBLIC_RESTAURANT_NAME || '美味餐廳'}</h1>
            <span className="text-sm text-muted">桌號 {table.number}</span>
          </div>
          <div className="flex gap-2">
            {orders.length > 0 && (
              <button
                onClick={() => setShowOrderTracker(true)}
                className="relative p-2 rounded-full bg-surface-light hover:bg-accent/20 transition-colors"
              >
                <Clock className="w-5 h-5 text-accent" />
              </button>
            )}
            <button
              onClick={handleServiceCall}
              className="p-2 rounded-full bg-surface-light hover:bg-accent/20 transition-colors"
            >
              <Bell className="w-5 h-5 text-accent" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜尋菜品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-light rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Category Nav */}
        {!searchQuery && (
          <div ref={categoryNavRef} className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-accent text-background'
                    : 'bg-surface-light text-muted hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Menu Items */}
      <main className="flex-1 p-4 pb-24 space-y-3">
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl p-3 flex gap-3 relative"
          >
            {(() => {
              const cartItem = cart.items.find(i => i.menuItem.id === item.id)
              return cartItem ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center shadow-lg z-10"
                >
                  {cartItem.quantity}
                </motion.div>
              ) : null
            })()}
            {item.image && (
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-light">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground leading-tight">
                    {item.name}
                    {item.isPopular && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-danger/20 text-danger font-medium">
                        人氣
                      </span>
                    )}
                  </h3>
                  {item.spicyLevel > 0 && (
                    <span className="text-xs text-muted">{getSpicyEmoji(item.spicyLevel)}</span>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-accent font-bold">{formatPrice(item.price)}</span>
                <div className="flex items-center gap-1.5">
                  {cart.items.find(i => i.menuItem.id === item.id) && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => cart.updateQuantity(item.id, (cart.items.find(i => i.menuItem.id === item.id)?.quantity || 0) - 1)}
                      className="w-8 h-8 rounded-full bg-surface-light text-foreground flex items-center justify-center hover:bg-danger/20 hover:text-danger transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      cart.addItem(item)
                      toast.success(`已加入 ${item.name}`, { duration: 1000 })
                    }}
                    className="w-8 h-8 rounded-full bg-accent text-background flex items-center justify-center hover:bg-accent-light transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center text-muted py-12">
            {searchQuery ? '找不到符合的菜品' : '此分類暫無菜品'}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {cart.totalItems > 0 && !showCart && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-accent text-background rounded-full px-6 py-3 flex items-center gap-3 shadow-lg shadow-accent/30 hover:bg-accent-light transition-colors z-50 max-w-lg w-[calc(100%-3rem)]"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-bold">{cart.totalItems} 品項</span>
          <span className="flex-1" />
          <span className="font-bold">{formatPrice(cart.totalAmount)}</span>
        </motion.button>
      )}

      {/* Cart Sheet */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 max-h-[85vh] flex flex-col max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-light">
                <h2 className="text-lg font-bold">購物車</h2>
                <button onClick={() => setShowCart(false)} className="p-1 rounded-full hover:bg-surface-light">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.items.map(item => (
                  <div key={item.menuItem.id} className="bg-surface-light rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.menuItem.name}</h4>
                      <button
                        onClick={() => cart.removeItem(item.menuItem.id)}
                        className="p-1 text-danger hover:bg-danger/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cart.updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-surface flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => cart.updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-surface flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-accent font-bold">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="備註（例：不要香菜、少辣）"
                      value={item.note}
                      onChange={(e) => cart.updateNote(item.menuItem.id, e.target.value)}
                      className="mt-2 w-full bg-surface rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                ))}

                {/* Order note */}
                <div className="pt-2">
                  <label className="text-sm text-muted mb-1 block">整筆訂單備註</label>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="特殊需求..."
                    rows={2}
                    className="w-full bg-surface-light rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-surface-light p-4">
                <div className="flex justify-between mb-3">
                  <span className="text-muted">總計</span>
                  <span className="text-xl font-bold text-accent">{formatPrice(cart.totalAmount)}</span>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting || cart.items.length === 0}
                  className="w-full py-3 rounded-xl bg-accent text-background font-bold text-lg hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? '送出中...' : '送出訂單'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order Tracker Sheet */}
      <AnimatePresence>
        {showOrderTracker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderTracker(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 max-h-[85vh] flex flex-col max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-light">
                <h2 className="text-lg font-bold">訂單追蹤</h2>
                <button onClick={() => setShowOrderTracker(false)} className="p-1 rounded-full hover:bg-surface-light">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-surface-light rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-accent">#{order.orderNumber}</span>
                      <span className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusIcon(item.status)}
                            <span className="text-sm">{item.menuItem.name} x{item.quantity}</span>
                          </div>
                          <span className="text-xs text-muted">{getOrderItemStatusLabel(item.status)}</span>
                        </div>
                      ))}
                    </div>
                    {order.customerNote && (
                      <p className="mt-2 text-xs text-muted border-t border-surface pt-2">備註：{order.customerNote}</p>
                    )}
                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="text-center text-muted py-8">尚無訂單</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
