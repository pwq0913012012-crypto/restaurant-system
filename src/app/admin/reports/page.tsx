'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { formatPrice } from '@/lib/utils'

type ReportData = {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  topItems: Array<{ name: string; count: number; revenue: number }>
  categorySales: Array<{ name: string; revenue: number }>
  revenueChart: Array<{ date: string; revenue: number }>
}

const COLORS = ['#d4a439', '#3b82f6', '#2ecc71', '#e74c3c', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?period=${period}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) setData(result.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  const exportCSV = () => {
    if (!data) return
    const headers = ['品項,銷量,營收']
    const rows = data.topItems.map(i => `${i.name},${i.count},${i.revenue}`)
    const csv = [...headers, ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">營收報表</h1>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-light text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="today">今日</option>
            <option value="week">本週</option>
            <option value="month">本月</option>
          </select>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-surface-light text-muted hover:text-foreground flex items-center gap-1 text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl p-4 border border-surface-light">
          <p className="text-sm text-muted">總營收</p>
          <p className="text-2xl font-bold text-accent">{formatPrice(data?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-surface-light">
          <p className="text-sm text-muted">訂單數</p>
          <p className="text-2xl font-bold">{data?.totalOrders || 0}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-surface-light">
          <p className="text-sm text-muted">平均客單價</p>
          <p className="text-2xl font-bold">{formatPrice(data?.avgOrderValue || 0)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      {data && data.revenueChart.length > 1 && (
        <div className="bg-surface rounded-xl p-4 border border-surface-light mb-6">
          <h3 className="font-bold mb-4">營收趨勢</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2f52" />
                <XAxis dataKey="date" stroke="#8892a4" fontSize={12} />
                <YAxis stroke="#8892a4" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#16213e', border: '1px solid #1f2f52', borderRadius: '8px' }}
                  labelStyle={{ color: '#8892a4' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#d4a439" strokeWidth={2} dot={{ fill: '#d4a439' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-surface rounded-xl p-4 border border-surface-light">
          <h3 className="font-bold mb-4">熱銷排行 Top 10</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topItems || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2f52" />
                <XAxis type="number" stroke="#8892a4" fontSize={12} />
                <YAxis dataKey="name" type="category" width={80} stroke="#8892a4" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#16213e', border: '1px solid #1f2f52', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#d4a439" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="bg-surface rounded-xl p-4 border border-surface-light">
          <h3 className="font-bold mb-4">分類銷售佔比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categorySales || []}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {(data?.categorySales || []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#16213e', border: '1px solid #1f2f52', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
