'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, CreditCard, LogOut, Users, Clock,
  ChevronRight, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSSE } from '@/hooks/useSSE'
import { formatPrice, getTableStatusLabel, getTableStatusColor, getOrderStatusLabel, minutesAgo } from '@/lib/utils'
import type { Table, Order, OrderItem, MenuItem, Payment } from '@/generated/prisma/client'

type OrderItemWithMenu = OrderItem & { menuItem: MenuItem }
type OrderWithItems = Order & { items: OrderItemWithMenu[]; table: Table; payment: Payment | null }
type TableWithOrders = Table & { orders: OrderWithItems[] }

export default function WaiterPage() {
  const [tables, setTables] = useState<TableWithOrders[]>([])
  const [selectedTable, setSelectedTable] = useState<TableWithOrders | null>(null)
  const [serviceCalls, setServiceCalls] = useState<Array<{ id: string; tableId: string; tableNumber?: number; createdAt: string }>>([])
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE'>('CASH')
  const [loading, setLoading] = useState(true)

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/tables')
      const result = await res.json()
      if (result.success) setTables(result.data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const fetchServiceCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/service-call')
      const result = await res.json()
      if (result.success) setServiceCalls(result.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchTables()
    fetchServiceCalls()
  }, [fetchTables, fetchServiceCalls])

  useSSE('waiter', useCallback((event: string, data: unknown) => {
    if (event === 'new-order' || event === 'order-updated' || event === 'table-paid') {
      fetchTables()
    }
    if (event === 'service-call') {
      const call = data as { id: string; tableId: string; tableNumber?: number }
      setServiceCalls(prev => [...prev, { ...call, createdAt: new Date().toISOString() }])
      toast('服務生呼叫！桌號 ' + (call.tableNumber || ''), { icon: '🔔', duration: 5000 })
      try { new Audio('/notification.mp3').play() } catch { /* ignore */ }
    }
  }, [fetchTables]))

  const handleAcknowledgeCall = async (callId: string) => {
    await fetch('/api/service-call', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: callId, status: 'RESOLVED' }),
    })
    setServiceCalls(prev => prev.filter(c => c.id !== callId))
  }

  const handlePayment = async () => {
    if (!selectedTable) return
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: selectedTable.id, method: paymentMethod }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`結帳成功！總金額：${formatPrice(result.data.totalAmount)}`)
        setShowPayment(false)
        setSelectedTable(null)
        fetchTables()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('結帳失敗')
    }
  }

  const handleUpdateTableStatus = async (tableId: string, status: string) => {
    // Optimistic update for selectedTable
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable({ ...selectedTable, status: status as TableWithOrders['status'] })
    }
    // Optimistic update for tables grid
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: status as TableWithOrders['status'] } : t))
    const statusLabels: Record<string, string> = {
      AVAILABLE: '已設為空桌',
      RESERVED: '已設為預約',
      CLEANING: '已設為清潔中',
      OCCUPIED: '已設為用餐中',
    }
    toast.success(statusLabels[status] || '狀態已更新')
    await fetch(`/api/tables/${tableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTables()
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const getTableTotal = (table: TableWithOrders) => {
    return table.orders
      .filter(o => !o.payment && o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  }

  const zones = [...new Set(tables.map(t => t.zone))].sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface border-b border-surface-light px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-accent">外場服務</h1>
        <div className="flex items-center gap-3">
          {serviceCalls.length > 0 && (
            <span className="relative">
              <Bell className="w-6 h-6 text-danger animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                {serviceCalls.length}
              </span>
            </span>
          )}
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-surface-light text-muted">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Service Calls Banner */}
      {serviceCalls.length > 0 && (
        <div className="px-4 py-2 space-y-2">
          {serviceCalls.map(call => (
            <div key={call.id} className="bg-danger/20 border border-danger/30 rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-danger" />
                <span className="text-sm font-medium text-danger">
                  桌號 {call.tableNumber || '?'} 呼叫服務生
                </span>
              </div>
              <button
                onClick={() => handleAcknowledgeCall(call.id)}
                className="text-xs px-3 py-1 rounded-full bg-danger text-white hover:bg-danger/80"
              >
                已處理
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Table Grid by Zone */}
      <main className="p-4 space-y-6">
        {zones.map(zone => (
          <div key={zone}>
            <h2 className="text-sm font-medium text-muted mb-3">{zone}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {tables.filter(t => t.zone === zone).map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`relative rounded-xl p-3 text-center transition-all border-2 hover:scale-[1.03] ${
                    table.status === 'AVAILABLE'
                      ? 'bg-green-500/10 border-green-500/40 hover:border-green-400'
                      : table.status === 'OCCUPIED'
                      ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
                      : table.status === 'RESERVED'
                      ? 'bg-blue-500/10 border-blue-500/40 hover:border-blue-400'
                      : 'bg-gray-500/10 border-gray-500/40 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl font-bold text-foreground">{table.number}</div>
                  <div className={`text-xs font-medium mt-1 ${
                    table.status === 'AVAILABLE' ? 'text-green-400'
                    : table.status === 'OCCUPIED' ? 'text-amber-400'
                    : table.status === 'RESERVED' ? 'text-blue-400'
                    : 'text-gray-400'
                  }`}>
                    {getTableStatusLabel(table.status)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-muted" />
                    <span className="text-base font-bold text-accent">{table.seats}</span>
                    <span className="text-[10px] text-muted">座</span>
                  </div>
                  {table.orders.length > 0 && (
                    <div className="text-xs text-accent font-medium mt-1">
                      {formatPrice(getTableTotal(table))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Table Detail Sheet */}
      <AnimatePresence>
        {selectedTable && !showPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-light">
                <div>
                  <h2 className="text-lg font-bold">桌號 {selectedTable.number}</h2>
                  <span className="text-sm text-muted">{selectedTable.zone} / {selectedTable.seats} 座</span>
                </div>
                <button onClick={() => setSelectedTable(null)} className="p-1 rounded-full hover:bg-surface-light">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="p-4 flex gap-2 border-b border-surface-light">
                {selectedTable.status === 'OCCUPIED' && (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="flex-1 py-2 rounded-lg bg-accent text-background font-medium flex items-center justify-center gap-1 text-sm"
                  >
                    <CreditCard className="w-4 h-4" /> 結帳
                  </button>
                )}
                {selectedTable.status === 'CLEANING' && (
                  <button
                    onClick={() => handleUpdateTableStatus(selectedTable.id, 'AVAILABLE')}
                    className="flex-1 py-2 rounded-lg bg-success text-background font-medium flex items-center justify-center gap-1 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> 清潔完畢
                  </button>
                )}
                {(selectedTable.status === 'AVAILABLE' || selectedTable.status === 'RESERVED') && (
                  <div className="flex-1 flex flex-col gap-2">
                    <motion.button
                      whileTap={selectedTable.status === 'AVAILABLE' ? { scale: 0.93 } : {}}
                      whileHover={selectedTable.status === 'AVAILABLE' ? { scale: 1.02 } : {}}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      onClick={() => selectedTable.status === 'AVAILABLE' && handleUpdateTableStatus(selectedTable.id, 'RESERVED')}
                      className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1 text-sm transition-all duration-500 ${
                        selectedTable.status === 'AVAILABLE'
                          ? 'bg-blue-500 text-white cursor-pointer active:brightness-90'
                          : 'bg-blue-500/20 text-blue-500/40 cursor-default'
                      }`}
                    >
                      <Clock className="w-4 h-4" /> 設為預約
                    </motion.button>
                    <motion.button
                      whileTap={selectedTable.status === 'RESERVED' ? { scale: 0.93 } : {}}
                      whileHover={selectedTable.status === 'RESERVED' ? { scale: 1.02 } : {}}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      onClick={() => selectedTable.status === 'RESERVED' && handleUpdateTableStatus(selectedTable.id, 'AVAILABLE')}
                      className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1 text-sm transition-all duration-500 ${
                        selectedTable.status === 'RESERVED'
                          ? 'bg-danger text-white cursor-pointer active:brightness-90'
                          : 'bg-danger/20 text-danger/40 cursor-default'
                      }`}
                    >
                      <X className="w-4 h-4" /> 取消預約
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Orders */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTable.orders.length === 0 ? (
                  <div className="text-center text-muted py-8">目前沒有訂單</div>
                ) : (
                  selectedTable.orders.map(order => (
                    <div key={order.id} className="bg-surface-light rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-accent">#{order.orderNumber}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-muted">
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>
                        <span className="text-xs text-muted">{minutesAgo(new Date(order.createdAt))} 分鐘前</span>
                      </div>
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span>{item.menuItem.name} x{item.quantity}</span>
                          <span className="text-muted">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                      {order.customerNote && (
                        <div className="mt-2 text-xs text-amber-400 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {order.customerNote}
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-surface flex justify-between font-medium">
                        <span>小計</span>
                        <span className="text-accent">{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              {selectedTable.orders.length > 0 && (
                <div className="border-t border-surface-light p-4 flex justify-between items-center">
                  <span className="font-medium">總計</span>
                  <span className="text-2xl font-bold text-accent">
                    {formatPrice(getTableTotal(selectedTable))}
                  </span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Sheet */}
      <AnimatePresence>
        {showPayment && selectedTable && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPayment(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 p-6 max-w-md mx-auto"
            >
              <h2 className="text-lg font-bold mb-4">結帳 - 桌號 {selectedTable.number}</h2>
              <div className="text-3xl font-bold text-accent text-center mb-6">
                {formatPrice(getTableTotal(selectedTable))}
              </div>

              <div className="space-y-3 mb-6">
                <label className="text-sm text-muted">付款方式</label>
                {(['CASH', 'CARD', 'MOBILE'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`w-full py-3 rounded-lg border flex items-center justify-between px-4 transition-all ${
                      paymentMethod === m
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-surface-light text-muted hover:border-muted'
                    }`}
                  >
                    <span>{m === 'CASH' ? '現金' : m === 'CARD' ? '信用卡' : '行動支付'}</span>
                    {paymentMethod === m && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-3 rounded-xl border border-surface-light text-muted hover:text-foreground"
                >
                  取消
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 py-3 rounded-xl bg-accent text-background font-bold hover:bg-accent-light flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  確認結帳
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
