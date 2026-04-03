'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports?period=today')
      .then(r => r.json())
      .then(result => {
        if (result.success) setStats(result.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">今日總覽</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-surface-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted">今日營收</p>
              <p className="text-2xl font-bold text-accent">{formatPrice(stats?.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-surface-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted">訂單數</p>
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-surface-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">平均客單價</p>
              <p className="text-2xl font-bold">{formatPrice(stats?.avgOrderValue || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
