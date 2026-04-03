'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'

type UserData = {
  id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string
}

const roleLabels: Record<string, string> = { ADMIN: '管理者', WAITER: '服務生', KITCHEN: '廚房' }

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{
    id?: string; name: string; email: string; password: string; role: string
  } | null>(null)

  const fetchData = async () => {
    const res = await fetch('/api/users')
    const result = await res.json()
    if (result.success) setUsers(result.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const saveUser = async () => {
    if (!editing) return
    const method = editing.id ? 'PUT' : 'POST'
    const url = editing.id ? `/api/users/${editing.id}` : '/api/users'
    const body: Record<string, unknown> = {
      name: editing.name,
      email: editing.email,
      role: editing.role,
    }
    if (editing.password) body.password = editing.password

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await res.json()
    if (result.success) {
      toast.success(editing.id ? '已更新帳號' : '已建立帳號')
      setEditing(null)
      fetchData()
    } else toast.error(result.error)
  }

  const deleteUser = async (id: string) => {
    if (!confirm('確定刪除此帳號？')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    toast.success('已刪除')
    fetchData()
  }

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">帳號管理</h1>
        <button
          onClick={() => setEditing({ name: '', email: '', password: '', role: 'WAITER' })}
          className="px-4 py-2 rounded-lg bg-accent text-background font-medium flex items-center gap-2 hover:bg-accent-light text-sm"
        >
          <Plus className="w-4 h-4" /> 新增帳號
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-surface-light overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-light">
              <th className="text-left px-4 py-3 text-sm text-muted font-medium">名稱</th>
              <th className="text-left px-4 py-3 text-sm text-muted font-medium">信箱</th>
              <th className="text-left px-4 py-3 text-sm text-muted font-medium">角色</th>
              <th className="text-left px-4 py-3 text-sm text-muted font-medium">狀態</th>
              <th className="text-right px-4 py-3 text-sm text-muted font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-surface-light last:border-0 hover:bg-surface-light/50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">{roleLabels[user.role]}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${user.isActive ? 'bg-success' : 'bg-muted'}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing({ id: user.id, name: user.name, email: user.email, password: '', role: user.role })} className="p-1.5 rounded hover:bg-surface text-muted hover:text-foreground">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded hover:bg-danger/10 text-muted hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editing.id ? '編輯帳號' : '新增帳號'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="名稱" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              <input type="email" placeholder="電子郵件" value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              <input type="password" placeholder={editing.id ? '新密碼（留空不修改）' : '密碼'}
                value={editing.password}
                onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              <select value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="WAITER">服務生</option>
                <option value="KITCHEN">廚房</option>
                <option value="ADMIN">管理者</option>
              </select>
            </div>
            <button onClick={saveUser} className="w-full mt-4 py-2.5 rounded-lg bg-accent text-background font-bold hover:bg-accent-light">儲存</button>
          </div>
        </div>
      )}
    </div>
  )
}
