'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, QrCode, RefreshCw, X, Download, Users } from 'lucide-react'
import toast from 'react-hot-toast'

type TableData = {
  id: string; number: number; seats: number; zone: string; status: string; qrCode: string
}

export default function TableManagement() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ id?: string; number: number; seats: number; zone: string } | null>(null)
  const [qrData, setQrData] = useState<{ url: string; qrCode: string } | null>(null)

  const fetchData = async () => {
    const res = await fetch('/api/tables')
    const result = await res.json()
    if (result.success) setTables(result.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const saveTable = async () => {
    if (!editing) return
    if (editing.id) {
      await fetch(`/api/tables/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: editing.seats, zone: editing.zone }),
      })
      toast.success('已更新桌位')
    } else {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      const result = await res.json()
      if (result.success) toast.success('已新增桌位')
      else { toast.error(result.error); return }
    }
    setEditing(null)
    fetchData()
  }

  const deleteTable = async (id: string) => {
    if (!confirm('確定刪除此桌位？')) return
    await fetch(`/api/tables/${id}`, { method: 'DELETE' })
    toast.success('已刪除')
    fetchData()
  }

  const showQR = async (tableNumber: number) => {
    const res = await fetch(`/api/qrcode/${tableNumber}`)
    const result = await res.json()
    if (result.success) setQrData(result.data)
  }

  const zones = [...new Set(tables.map(t => t.zone))].sort()

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">桌位管理</h1>
        <button
          onClick={() => setEditing({ number: tables.length + 1, seats: 4, zone: 'A區' })}
          className="px-4 py-2 rounded-lg bg-accent text-background font-medium flex items-center gap-2 hover:bg-accent-light text-sm"
        >
          <Plus className="w-4 h-4" /> 新增桌位
        </button>
      </div>

      {zones.map(zone => (
        <div key={zone} className="mb-6">
          <h2 className="text-lg font-medium text-muted mb-3">{zone}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.filter(t => t.zone === zone).map(table => (
              <div key={table.id} className={`rounded-xl p-4 border-2 transition-all hover:scale-[1.03] ${
                table.status === 'AVAILABLE'
                  ? 'bg-green-500/10 border-green-500/40'
                  : table.status === 'OCCUPIED'
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : table.status === 'RESERVED'
                  ? 'bg-blue-500/10 border-blue-500/40'
                  : 'bg-gray-500/10 border-gray-500/40'
              }`}>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{table.number}</div>
                  <div className={`text-xs font-medium mb-1 ${
                    table.status === 'AVAILABLE' ? 'text-green-400'
                    : table.status === 'OCCUPIED' ? 'text-amber-400'
                    : table.status === 'RESERVED' ? 'text-blue-400'
                    : 'text-gray-400'
                  }`}>
                    {table.status === 'AVAILABLE' ? '空桌' : table.status === 'OCCUPIED' ? '用餐中' : table.status === 'RESERVED' ? '已預約' : '清潔中'}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Users className="w-3.5 h-3.5 text-muted" />
                    <span className="text-lg font-bold text-accent">{table.seats}</span>
                    <span className="text-xs text-muted">座</span>
                  </div>
                </div>
                <div className="flex justify-center gap-1">
                  <button onClick={() => showQR(table.number)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-accent">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing({ id: table.id, number: table.number, seats: table.seats, zone: table.zone })} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteTable(table.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editing.id ? '編輯桌位' : '新增桌位'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {!editing.id && (
                <div>
                  <label className="text-xs text-muted">桌號</label>
                  <input type="number" value={editing.number}
                    onChange={(e) => setEditing({ ...editing, number: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted">座位數</label>
                <input type="number" value={editing.seats}
                  onChange={(e) => setEditing({ ...editing, seats: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs text-muted">區域</label>
                <select value={editing.zone}
                  onChange={(e) => setEditing({ ...editing, zone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="A區">A區</option>
                  <option value="B區">B區</option>
                  <option value="C區">C區</option>
                  <option value="露台">露台</option>
                  <option value="包廂">包廂</option>
                </select>
              </div>
            </div>
            <button onClick={saveTable} className="w-full mt-4 py-2.5 rounded-lg bg-accent text-background font-bold hover:bg-accent-light">儲存</button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setQrData(null)}>
          <div className="bg-surface rounded-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">掃描 QR Code 點餐</h3>
            <img src={qrData.qrCode} alt="QR Code" className="mx-auto mb-3" />
            <p className="text-sm text-muted mb-4 break-all">{qrData.url}</p>
            <a href={qrData.qrCode} download="qrcode.png" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-medium hover:bg-accent-light text-sm">
              <Download className="w-4 h-4" /> 下載 QR Code
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
