'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, UtensilsCrossed } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()
      if (result.success) {
        const role = result.data.user.role
        if (role === 'ADMIN') router.push('/admin')
        else if (role === 'KITCHEN') router.push('/kitchen')
        else router.push('/waiter')
      } else {
        toast.error(result.error || '登入失敗')
      }
    } catch {
      toast.error('網路錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">參考產品</h1>
          <p className="text-muted mt-2">員工登入</p>
        </div>

        <div className="bg-surface/50 rounded-xl p-4 mb-4 text-xs text-muted border border-surface-light">
          <div className="text-accent font-medium mb-2">測試帳號</div>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 pb-1.5 mb-1.5 border-b border-surface-light text-[10px] uppercase tracking-wide">
            <span>角色</span>
            <span className="text-center">帳號</span>
            <span className="text-right">密碼</span>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
              <span>管理者</span>
              <span className="font-mono text-center">a</span>
              <span className="font-mono text-right">a</span>
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
              <span>服務生</span>
              <span className="font-mono text-center">w</span>
              <span className="font-mono text-right">w</span>
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
              <span>廚房</span>
              <span className="font-mono text-center">k</span>
              <span className="font-mono text-right">k</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">帳號</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="請輸入帳號"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-background font-bold hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-surface-light" />
          <span className="text-xs text-muted">或</span>
          <div className="flex-1 h-px bg-surface-light" />
        </div>

        <button
          onClick={() => router.push('/order/1')}
          className="w-full mt-4 py-3 rounded-xl border border-accent text-accent font-bold hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
        >
          <UtensilsCrossed className="w-5 h-5" />
          以客人身份進入
        </button>
      </div>
    </div>
  )
}
